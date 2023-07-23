import React, { useEffect, useState } from "react";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import APIStore from "../APIStore";
import { fakeFetch, fakePaginatingFetch, useRenderCount } from "./test-utils";
import { createTable, createModel, operation } from "../model";
import { useQuery } from "../useQuery";
import { act } from "react-dom/test-utils";
import { useMutation } from "../useMutation";
import { useInfiniteQuery } from "../useInfiniteQuery";
import { Model, UseAPIStore } from "../types";
import { toModel } from "../reducer";

/**
 * The purpose of this file is to test a real world situation.
 * 
 * We will have :~
 * 1. An authenticated user.
 * 2. Other users.
 * 3. Posts
 * 4. Comments
 * 5. Profiles
 * 
 * 
 * Scene 1
 * Sign up page
 * 
 * A user enters:
 *  username, email, password, gender, dob
 * 
 * The response is:
 *  token, user information.
 * 
 * The result:
 *  The user is authenticated.
 * 
 */


type User = {
  id: number;
  username: string;
  email: string;
  gender: string;
  dob: string;
  token?: Token | number;
}

type Token = {
  user: User | number;
  token: string;
}

const token = createTable("token", {}, { pk: "user" })
const user = createTable("user", { id: "number" });
const image = createTable("image", { id: "number" })
const thumbnail = createTable("thumbnail", { id: "number" })

token.hasOne(user)

user.hasOne(token)
user.hasOne(image)
user.hasOne(image, "profileImage")
user.hasOne(image, "bannerImage")

image.hasMany(thumbnail, "thumbnails")


const model = createModel([
  user,
  token,
  image,
  thumbnail,
])

const users = {
  10: {
    token: {
      user: 10,
      token: "<secret>"
    },
    id: 10,
    username: "Joshua",
    email: "joshua@gmail.com",
    gender: "male",
    dob: "21-02-1998",
  },
  11: {
    id: 11,
    username: "Hannah",
    email: "hannah@gmail.com",
    gender: "female",
    dob: "26-01-2000",
  },
  12: {
    id: 12,
    username: "May",
    email: "amy@gmail.com",
    gender: "female",
    dob: "26-01-2000",
    token: {
      user: 12,
      token: "<secret>"
    },
  },
}

const wrapper = ({ children }: React.PropsWithChildren) => {


  function GetOtherUsers() {

    useQuery({
      table: "user",
      get: { result: Object.values(users) },
    });

    return (<>{children}</>)
  }

  return <APIStore model={model}><GetOtherUsers /></APIStore>
}

describe("useQuery hook tests", () => {


  it("useQuery with fetcher and result.", async () => {

    const data = {
      id: 10,
      username: "Joshua",
      email: "joshua@gmail.com",
      gender: "male",
      dob: "21-02-1998",
      token: {
        user: 10,
        token: "<secret>",
      }
    }

    const updatedData = { ...data, dob: "<updated-dob>" };

    const fetch = () => fakeFetch(updatedData, 100)

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: {
          result: data,
          fetch,
        },
      })
    ), { wrapper });

    expect(result.current.isFetching).toBe(true);
    expect(result.current.result).toStrictEqual(data);

    await waitFor(() => expect(result.current.isFetching).toBe(false))

    expect(result.current.isFetching).toBe(false);
    expect(result.current.result).toStrictEqual(updatedData);

  });


  it("useQuery with fetcher", async () => {

    const data = {
      id: 10,
      username: "Joshua",
      email: "joshua@gmail.com",
      gender: "male",
      dob: "21-02-1998",
      token: {
        user: 10,
        token: "<secret>",
      }
    }

    const fetch = () => fakeFetch(data, 100)

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: { fetch },
      })
    ), { wrapper });

    expect(result.current.isFetching).toBe(true);

    await waitFor(() => expect(result.current.isFetching).toBe(false))

    expect(result.current.isFetching).toBe(false);
    expect(result.current.result).toStrictEqual(data);

  });


  it("useQuery with result", async () => {

    const data = {
      id: 10,
      username: "Joshua",
      email: "joshua@gmail.com",
      gender: "male",
      dob: "21-02-1998",
      token: {
        user: 10,
        token: "<secret>",
      }
    }

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: { result: data },
      })
    ), { wrapper });

    expect(result.current.result).toStrictEqual(data)

  });


  it("useQuery with result and where clause, token.user", async () => {

    const data = {
      token: "<secret>",
      user: {
        id: 10,
        username: "Joshua",
        email: "joshua@gmail.com",
        gender: "male",
        dob: "21-02-1998",
      },
    }

    const { result } = renderHook(() => (
      useQuery({
        table: "token",
        get: {
          result: data,
          where: {
            user: {
              id: 10
            }
          }
        },
      })
    ), { wrapper });

    await waitFor(() => {
      // console.log("RESULT",result.current.result)
      expect(result.current.result).toStrictEqual({ ...data, user: { ...data.user, token: 10 } })
    })
  });


  it("useQuery with result and where clause, user.token", async () => {

    const data = {
      id: 10,
      username: "Joshua",
      email: "joshua@gmail.com",
      gender: "male",
      dob: "21-02-1998",
      token: {
        user: 10,
        token: "<secret>",
      }
    }

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: {
          result: data,
          where: {
            id: 10,
            token: {
              user: 10
            }
          }
        },
      })
    ), { wrapper });


    expect(result.current.result).toStrictEqual(data)
  });


  it("useQuery data is token with user, where clause get only token.", async () => {

    const data = {
      token: "<secret>",
      user: {
        id: 10,
        username: "Joshua",
        email: "joshua@gmail.com",
        gender: "male",
        dob: "21-02-1998",
      },
    }

    const { result } = renderHook(() => (
      useQuery({
        table: "token",
        get: {
          result: data,
          where: {
            user: 10
          }
        },
      })
    ), { wrapper });

    expect(result.current.result).toStrictEqual({
      user: 10,
      token: "<secret>",
    });

  });


  it("useQuery data is user with token, where clause get only user.", async () => {

    const data: User = {
      id: 10,
      username: "Joshua",
      email: "joshua@gmail.com",
      gender: "male",
      dob: "21-02-1998",
      token: {
        user: 10,
        token: "<secret>"
      }
    }

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: {
          result: data,
          where: { id: 10 }
        },
      })
    ), { wrapper });


    expect(result.current.result).toStrictEqual({
      id: 10,
      username: "Joshua",
      email: "joshua@gmail.com",
      gender: "male",
      dob: "21-02-1998",
      token: 10
    });

  });


  it("useQuery get a single existing user Hannah by id.", async () => {

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: {
          where: { id: 11 }
        },
      })
    ), { wrapper });

    expect(result.current.result).toStrictEqual(users[11]);

  });


  it("useQuery get an array existing users by gender.", async () => {

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: {
          where: { gender: "female" }
        },
      })
    ), { wrapper });

    expect(result.current.result).toStrictEqual([users[11], { ...users[12], token: users[12].token.user }]);
  });

  it("useQuery result is an array.", async () => {

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: { result: Object.values(users) },
      })
    ), { wrapper });

    expect(result.current.result).toStrictEqual(Object.values(users));
  });


  it("useQuery result is an array, where has duplicate values.", async () => {

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: {
          result: Object.values(users),
          where: [...Object.values(users), ...Object.values(users)]
        },
      })
    ), { wrapper });


    expect(result.current.result).toStrictEqual(Object.values(users));
  });


  it("useQuery getData function test.", async () => {

    const { result } = renderHook(() => (
      useQuery({
        table: "user",
        get: {
          result: { data: Object.values(users) },
        },
        getData: r => r.data
      })
    ), { wrapper });

    expect(result.current.result).toStrictEqual(Object.values(users));
  });

});


describe("useQuery hook component tests", () => {


  function Dob(props: { id: number; }) {

    const store = useQuery<User, User>({
      table: "user",
      get: {
        where: { id: props.id }
      },
      fields: { user: ["dob"] },
      enabled: false
    })

    const count = useRenderCount([store])

    return (
      <>
        <p data-testid={`count-dob-${props.id}`} >Count({props.id}): {count}</p>
        <p data-testid="profile-dob">{store.result?.dob}</p>
      </>
    )
  }

  function Profile(props: { id: number; }) {

    const store = useQuery<User, User>({
      table: "user",
      get: {
        where: { id: props.id }
      },
      enabled: false,
      fields: {
        user: ["username"]
      }
    })

    const count = useRenderCount([store])

    return (
      <>
        <p data-testid={`count-profile-${props.id}`} >Count({props.id}): {count}</p>
        <p data-testid="profile-username">{store.result?.username}</p>
        <Dob id={props.id} />
      </>
    )
  }

  const UserComponent = (props: { id: number; }) => {

    const data = (users as any)[props.id];

    const fetch = (count: any) => fakeFetch({ ...data, dob: `<updated-dob> [${count}]` }, 100)

    const store = useQuery({
      table: "user",
      get: {
        result: data,
        fetch
      },
      fields: {
        user: ["dob"]
      },
      enabled: false
    })

    const count = useRenderCount([store])

    const handleButtonClick = () => store.refetch(count);

    return (
      <div>
        <p data-testid={`dob-${props.id}`} >{store.result?.dob}</p>
        <p data-testid={`count-${props.id}`} >Count({props.id}): {count}</p>
        <button data-testid={`refetch-${props.id}`} onClick={handleButtonClick}>Update {props.id}</button>
      </div>
    );
  }


  it("Using 'result': Should rerender only the component where data changes", async () => {

    function UserListComponent() {

      const store = useQuery({
        table: "user",
        get: { result: Object.values(users) },
        fields: {
          user: ["id", "dob", "username"],
        }
      })

      const count = useRenderCount([store])

      const renderItem = (user: User, index: number) => user && <UserComponent key={index} id={user.id} />

      return (
        <>
          <p data-testid={`count-list`} >Count(list): {count}</p>
          {store.result?.map(renderItem)}
        </>
      )
    }

    render(
      <>
        <UserListComponent />
        <Profile id={12} />
      </>,
      { wrapper }
    )

    const countListElement = screen.getByTestId("count-list");
    const count10Element = screen.getByTestId("count-10");
    const count11Element = screen.getByTestId("count-11");
    const count12Element = screen.getByTestId("count-12");
    const count12Dob = screen.getByTestId("dob-12");

    const countProfileUsername = screen.getByTestId("count-profile-12");
    const countProfileDob = screen.getByTestId("count-dob-12");

    expect(countListElement.textContent).toBe('Count(list): 2');
    expect(count10Element.textContent).toBe('Count(10): 1');
    expect(count11Element.textContent).toBe('Count(11): 1');
    expect(count12Element.textContent).toBe('Count(12): 1');

    expect(countProfileUsername.textContent).toBe('Count(12): 2');
    expect(countProfileDob.textContent).toBe('Count(12): 2');

    act(() => screen.getByTestId("refetch-12").click())

    await waitFor(async () => {
      expect(count12Dob.textContent).toBe('<updated-dob> [1]');
      expect(countListElement.textContent).toBe('Count(list): 2');
      expect(count10Element.textContent).toBe('Count(10): 1');
      expect(count11Element.textContent).toBe('Count(11): 1');
      expect(count12Element.textContent).toBe('Count(12): 2');

      expect(countProfileUsername.textContent).toBe('Count(12): 2');
      expect(countProfileDob.textContent).toBe('Count(12): 2');

    })

    act(() => screen.getByTestId("refetch-12").click())
    await waitFor(async () => {
      expect(count12Dob.textContent).toBe('<updated-dob> [2]');
      expect(countListElement.textContent).toBe('Count(list): 3');
      expect(count10Element.textContent).toBe('Count(10): 1');
      expect(count11Element.textContent).toBe('Count(11): 1');
      expect(count12Element.textContent).toBe('Count(12): 4');

      expect(countProfileUsername.textContent).toBe('Count(12): 2');
      expect(countProfileDob.textContent).toBe('Count(12): 3');
    })

    act(() => screen.getByTestId("refetch-12").click())
    await waitFor(async () => {
      expect(count12Dob.textContent).toBe('<updated-dob> [4]');
      expect(countListElement.textContent).toBe('Count(list): 4');
      expect(count10Element.textContent).toBe('Count(10): 1');
      expect(count11Element.textContent).toBe('Count(11): 1');
      expect(count12Element.textContent).toBe('Count(12): 6');

      expect(countProfileUsername.textContent).toBe('Count(12): 2');
      expect(countProfileDob.textContent).toBe('Count(12): 4');
    })

  });

  it("Using 'fetch': Should rerender only the component where data changes", async () => {

    function UserListComponent() {

      const fetch = (rand: any) => fakeFetch(Object.values(users), 100)

      const store = useQuery({
        table: "user",
        get: { fetch },
        fields: {
          user: ["id", "dob", "username"],
        }
      })

      const count = useRenderCount([store])

      const renderItem = (user: User, index: number) => user && <UserComponent key={index} id={user.id} />

      return (
        <>
          <p data-testid={`isFetching`} >{JSON.stringify(store.isFetching)}</p>
          <p data-testid={`count-list`} >Count(list): {count}</p>
          {store.result?.map(renderItem)}
        </>
      )
    }

    render(
      <>
        <UserListComponent />
        <Profile id={12} />
      </>,
      { wrapper }
    )

    const isFetching = screen.getByTestId("isFetching");
    expect(isFetching.textContent).toBe('true');

    await waitFor(async () => {
      expect(isFetching.textContent).toBe('false');
    })

    const countListElement = screen.getByTestId("count-list");
    const count10Element = screen.getByTestId("count-10");
    const count11Element = screen.getByTestId("count-11");
    const count12Element = screen.getByTestId("count-12");
    const count12Dob = screen.getByTestId("dob-12");

    const countProfileUsername = screen.getByTestId("count-profile-12");
    const countProfileDob = screen.getByTestId("count-dob-12");

    expect(countListElement.textContent).toBe('Count(list): 2');
    expect(count10Element.textContent).toBe('Count(10): 0');
    expect(count11Element.textContent).toBe('Count(11): 0');
    expect(count12Element.textContent).toBe('Count(12): 0');

    expect(countProfileUsername.textContent).toBe('Count(12): 2');
    expect(countProfileDob.textContent).toBe('Count(12): 2');

    act(() => screen.getByTestId("refetch-12").click())

    await waitFor(async () => {
      expect(count12Dob.textContent).toBe('<updated-dob> [0]');
      expect(countListElement.textContent).toBe('Count(list): 3');
      expect(count10Element.textContent).toBe('Count(10): 1');
      expect(count11Element.textContent).toBe('Count(11): 1');
      expect(count12Element.textContent).toBe('Count(12): 3');

      expect(countProfileUsername.textContent).toBe('Count(12): 2');
      expect(countProfileDob.textContent).toBe('Count(12): 2');
    })

    act(() => screen.getByTestId("refetch-12").click())
    await waitFor(async () => {
      expect(count12Dob.textContent).toBe('<updated-dob> [3]');
      expect(countListElement.textContent).toBe('Count(list): 4');
      expect(count10Element.textContent).toBe('Count(10): 1');
      expect(count11Element.textContent).toBe('Count(11): 1');
      expect(count12Element.textContent).toBe('Count(12): 5');

      expect(countProfileUsername.textContent).toBe('Count(12): 2');
      expect(countProfileDob.textContent).toBe('Count(12): 3');
    })

    act(() => screen.getByTestId("refetch-12").click())
    await waitFor(async () => {
      expect(count12Dob.textContent).toBe('<updated-dob> [5]');
      expect(countListElement.textContent).toBe('Count(list): 5');
      expect(count10Element.textContent).toBe('Count(10): 1');
      expect(count11Element.textContent).toBe('Count(11): 1');
      expect(count12Element.textContent).toBe('Count(12): 7');

      expect(countProfileUsername.textContent).toBe('Count(12): 2');
      expect(countProfileDob.textContent).toBe('Count(12): 4');
    })

  });

  it("The parent component should not rerender", async () => {

    function UpdateDob(props: { id: number; }) {

      const data: Partial<User> = {
        id: props.id,
        dob: "21-02-1998",
      }

      const fetch = (rand: any) => fakeFetch({ ...data, dob: `<updated-dob> [${rand}]` }, 100)

      const store = useQuery({
        table: "user",
        get: {
          result: data,
          fetch,
          where: { id: props.id }
        },
        getData: res => res,
        fields: { user: ["dob"] },
        enabled: false
      })

      const count = useRenderCount()

      const handleButtonClick = () => store.refetch(count);

      return (
        <>
          <p data-testid={`count-dob`} >Count dob: {count}</p>
          <p data-testid="dob">{store.result?.dob}</p>
          <button data-testid={`refetch`} onClick={handleButtonClick}>Update</button>
        </>
      )
    }

    function Parent() {

      const count = useRenderCount()


      return (
        <>
          <p data-testid={`count-parent`} >Count parent: {count}</p>
          <UpdateDob id={12} />
        </>
      )
    }

    render(<Parent />, { wrapper })

    const countParent = screen.getByTestId("count-parent");
    const countDob = screen.getByTestId("count-dob");
    const refetchDob = screen.getByTestId("refetch");


    expect(countParent.textContent).toBe('Count parent: 0');
    expect(countDob.textContent).toBe('Count dob: 1');


    act(() => refetchDob.click())

    await waitFor(async () => {
      expect(countParent.textContent).toBe('Count parent: 0');
      expect(countDob.textContent).toBe('Count dob: 3');
    })

    act(() => refetchDob.click())

    await waitFor(async () => {
      expect(countParent.textContent).toBe('Count parent: 0');
      expect(countDob.textContent).toBe('Count dob: 5');
    })

  });
});


describe("useMutation hook", () => {

  it("useMutation should mutate a value.", async () => {

    const data: Partial<User> = {
      id: 12,
      dob: "21-02-1998",
    }

    const fetch = (next: { dob: string; }) => fakeFetch({ ...data, ...next }, 100)

    const { result } = renderHook(() => (
      useMutation({
        table: "user",
        mutate: fetch,
      })
    ), { wrapper });

    const response = await act(() => result.current.mutate({ dob: "01-01-2000" }));

    expect(response).toStrictEqual({ id: 12, dob: "01-01-2000" });

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  });


  it("useMutation partial update.", async () => {

    function Parent() {

      const result = useQuery({
        table: "user",
        get: {
          result: { data: Object.values(users) },
        },
        getData: r => r.data
      })

      const request = useMutation({
        table: "user",
        mutate: (args) => fakeFetch(args, 100),
      });

      const mutate = () => request.mutate({ id: 12, dob: "New B'Day" });


      return (
        <>
          <p data-testid="result">{JSON.stringify(result.result)}</p>
          <button data-testid="mutate" onClick={mutate}>Mutate</button>
        </>
      )
    }

    render(<Parent />, { wrapper })

    const mutateButton = screen.getByTestId("mutate");
    const resultTag = screen.getByTestId("result");

    await waitFor(() => expect(JSON.parse(resultTag.textContent as string)).toStrictEqual(Object.values(users)))

    act(() => mutateButton.click())

    await waitFor(() => expect(JSON.parse(resultTag.textContent as string)).toStrictEqual(Object.values(users).map(u => ({ ...u, dob: u.id === 12 ? "New B'Day" : u.dob }))))

  });



})


describe("useInfiniteQuery hook", () => {


  it("Pagination test 1", async () => {

    function UserListComponent() {

      const fetch = async (nextParams: any) => fakePaginatingFetch(Object.values(users), nextParams)

      const store = useInfiniteQuery({
        table: "user",
        get: { fetch: next => fetch(next) },
        getData: (result) => result.data,
        getNextPageParams: (result) => result.nextParams,
        getNextPageKey: (result) => result.nextParams?.createdAt.toString(),
        fields: {
          user: ["id", "dob", "username"],
        }
      })

      const getNextPage = () => store.fetchNextPage()
      const refetch = () => store.refetch()

      return (
        <>
          <p data-testid={`result`}>{JSON.stringify(store.result?.length)}</p>
          <button data-testid={`refetch`} onClick={refetch}></button>
          <button data-testid={`fetchNextPage`} onClick={getNextPage}></button>
        </>
      )
    }

    render(<UserListComponent />, { wrapper })

    const refetch = screen.getByTestId("refetch");
    const fetchNextPage = screen.getByTestId("fetchNextPage");
    const result = screen.getByTestId("result");

    await waitFor(async () => {
      expect(result.textContent).toBe('2');
    })

    act(() => fetchNextPage.click())

    await waitFor(async () => {
      expect(result.textContent).toBe('3');
    })

    act(() => refetch.click())

    await waitFor(async () => {
      expect(result.textContent).toBe('3');
    })
  });

  it("Pagination test 2", async () => {

    function UserListComponent() {

      const fetch = async (nextParams: any) => {
        const result = await fakePaginatingFetch(Object.values(users), nextParams)
        return result
      }

      const store = useInfiniteQuery({
        table: "user",
        get: { fetch: next => fetch(next) },
        getData: (result) => result.data,
        getNextPageParams: (result) => result.nextParams,
        getNextPageKey: (result) => !result.nextParams ? null : result.nextParams.createdAt.toString(),
        fields: {
          user: ["id", "dob", "username"],
        }
      })

      const getNextPage = () => store.fetchNextPage()
      const refetch = () => store.refetch()

      return (
        <>
          <p data-testid={`result`}>{JSON.stringify(store.result?.length)}</p>
          <button data-testid={`refetch`} onClick={refetch}></button>
          <button data-testid={`fetchNextPage`} onClick={getNextPage}></button>
        </>
      )
    }

    render(<UserListComponent />, { wrapper })

    const refetch = screen.getByTestId("refetch");
    const result = screen.getByTestId("result");

    await waitFor(async () => {
      expect(result.textContent).toBe('2');
    })

    act(() => refetch.click())

    await waitFor(async () => {
      expect(result.textContent).toBe('2');
    })
  });


  it("Pagination test 3 enabled false", async () => {

    function UserListComponent() {

      const fetch = async (nextParams: any) => fakePaginatingFetch(Object.values(users), nextParams)

      const store = useInfiniteQuery({
        table: "user",
        get: { fetch: next => fetch(next) },
        getData: (result) => result.data,
        getNextPageParams: (result) => result.nextParams,
        getNextPageKey: (result) => result.nextParams?.createdAt.toString(),
        fields: {
          user: ["id", "dob", "username"],
        },
        enabled: false
      })

      const getNextPage = () => store.fetchNextPage()

      return (
        <>
          <p data-testid={`result`}>{JSON.stringify(store.result?.length)}</p>
          <button data-testid={`fetchNextPage`} onClick={getNextPage}></button>
        </>
      )
    }

    render(<UserListComponent />, { wrapper })

    const fetchNextPage = screen.getByTestId("fetchNextPage");
    const result = screen.getByTestId("result");

    await waitFor(async () => {
      expect(result.textContent).toBe('0');
    })

    act(() => fetchNextPage.click())

    await waitFor(async () => {
      expect(result.textContent).toBe('2');
    })

  });


  it("Pagination larger model", async () => {

    const user = createTable("user", { id: "number" })
    const image = createTable("image", { id: "number" })
    const imageThumbnail = createTable("thumbnail", { id: "number" })
    const post = createTable("post", { id: "number" })
    const postComment = createTable("postComment", { id: "number" })

    postComment.hasMany(postComment, "replies")
    postComment.hasOne(postComment, "replyingTo")
    postComment.hasOne(post)
    postComment.hasOne(user)

    post.hasOne(user)
    post.hasMany(image, "images")

    user.hasOne(image, "profileImage")
    user.hasOne(image, "bannerImage")
    user.hasOne(image, "layoutImage")
    image.hasMany(imageThumbnail, "thumbnails")

    const model = createModel([
      user,
      image,
      imageThumbnail,
      post,
      postComment,
    ]) as Model.Proto

    const largeWrapper = ({ children }: React.PropsWithChildren) => <APIStore model={model}>{children}</APIStore>

    const data1 = {
      "comments": [
        {
          "id": 40,
          "postId": 10,
          "replyingToId": null,
          "comment": "@the_overlord ",
          "createdAt": "2023-07-12T16:45:48.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 39,
          "postId": 10,
          "replyingToId": null,
          "comment": "Hey @the_overlord How are you?",
          "createdAt": "2023-07-12T16:17:51.000Z",
          "likeCount": 0,
          "replyCount": 3,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 38,
          "postId": 10,
          "replyingToId": null,
          "comment": "Hey there How are you? @joshua",
          "createdAt": "2023-07-12T15:25:47.000Z",
          "likeCount": 0,
          "replyCount": 8,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 37,
          "postId": 10,
          "replyingToId": null,
          "comment": "Muah! ♥️",
          "createdAt": "2023-07-12T13:16:54.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 36,
          "postId": 10,
          "replyingToId": null,
          "comment": "Ohh!!\n\n\n\nNice!  ❤️",
          "createdAt": "2023-07-11T16:21:50.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 35,
          "postId": 10,
          "replyingToId": null,
          "comment": "Where",
          "createdAt": "2023-07-11T16:21:19.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 34,
          "postId": 10,
          "replyingToId": null,
          "comment": "Why",
          "createdAt": "2023-07-11T16:21:06.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 33,
          "postId": 10,
          "replyingToId": null,
          "comment": "Huh",
          "createdAt": "2023-07-11T16:19:14.000Z",
          "likeCount": 1,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 32,
          "postId": 10,
          "replyingToId": null,
          "comment": "I",
          "createdAt": "2023-07-11T16:17:15.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 31,
          "postId": 10,
          "replyingToId": null,
          "comment": "Ok",
          "createdAt": "2023-07-11T16:17:03.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        }
      ],
      "nextParams": {
        "postId": "10",
        "createdAt": "2023-07-11T16:17:03.000Z"
      }
    }

    const data2 = {
      "comments": [
        {
          "id": 30,
          "postId": 10,
          "replyingToId": null,
          "comment": "Mmm",
          "createdAt": "2023-07-11T16:16:59.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 29,
          "postId": 10,
          "replyingToId": null,
          "comment": "Ok",
          "createdAt": "2023-07-11T16:08:11.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 28,
          "postId": 10,
          "replyingToId": null,
          "comment": "Hello!!!  😂 😮 😍",
          "createdAt": "2023-07-11T16:07:36.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 27,
          "postId": 10,
          "replyingToId": null,
          "comment": "Hi",
          "createdAt": "2023-07-11T15:59:15.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 26,
          "postId": 10,
          "replyingToId": null,
          "comment": "Lorem ipsum dolor sit amet consectetur",
          "createdAt": "2023-05-21T12:52:21.000Z",
          "likeCount": 1,
          "replyCount": 5,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 20,
          "postId": 10,
          "replyingToId": null,
          "comment": "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Non molestias dolor accusamus maxime blanditiis consectetur, est eligendi assumenda, temporibus corporis sapiente! Aspernatur optio voluptatibus nostrum, distinctio veniam eos architecto doloribus.",
          "createdAt": "2023-05-21T12:52:15.000Z",
          "likeCount": 1,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 19,
          "postId": 10,
          "replyingToId": null,
          "comment": "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Non molestias dolor accusamus maxime blanditiis consectetur, est eligendi assumenda, temporibus corporis sapiente! Aspernatur optio voluptatibus nostrum, distinctio veniam eos architecto doloribus.",
          "createdAt": "2023-05-21T12:52:14.000Z",
          "likeCount": 1,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 18,
          "postId": 10,
          "replyingToId": null,
          "comment": "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Non molestias dolor accusamus maxime blanditiis consectetur, est eligendi assumenda, temporibus corporis sapiente! Aspernatur optio voluptatibus nostrum, distinctio veniam eos architecto doloribus.",
          "createdAt": "2023-05-21T12:52:13.000Z",
          "likeCount": 1,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 17,
          "postId": 10,
          "replyingToId": null,
          "comment": "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Non molestias dolor accusamus maxime blanditiis consectetur, est eligendi assumenda, temporibus corporis sapiente! Aspernatur optio voluptatibus nostrum, distinctio veniam eos architecto doloribus.",
          "createdAt": "2023-05-21T12:52:12.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 16,
          "postId": 10,
          "replyingToId": null,
          "comment": "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Non molestias dolor accusamus maxime blanditiis consectetur, est eligendi assumenda, temporibus corporis sapiente! Aspernatur optio voluptatibus nostrum, distinctio veniam eos architecto doloribus.",
          "createdAt": "2023-05-21T12:52:11.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        }
      ],
      "nextParams": {
        "postId": "10",
        "createdAt": "2023-05-21T12:52:11.000Z"
      }
    }

    const data3 = {
      "comments": [
        {
          "id": 52,
          "postId": 10,
          "replyingToId": 39,
          "comment": "@the_overlord Hmmm",
          "createdAt": "2023-07-20T14:43:00.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 2,
            "username": "qwerty",
            "profileImage": {
              "id": 48,
              "baseScale": "1.4",
              "pinchScale": "1",
              "translateX": "-3.5714285714285716",
              "translateY": "28.571428571428573",
              "originContainerWidth": "252",
              "originContainerHeight": "252",
              "aspectRatio": 0.777344,
              "thumbnails": [
                {
                  "id": 186,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/profilePhoto.256.jpeg?1687444436097",
                  "height": 256,
                  "width": 199
                },
                {
                  "id": 187,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/profilePhoto.512.jpeg?1687444436097",
                  "height": 512,
                  "width": 398
                },
                {
                  "id": 188,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/profilePhoto.original.jpeg?1687444436095",
                  "height": 900,
                  "width": 700
                }
              ]
            }
          }
        },
        {
          "id": 51,
          "postId": 10,
          "replyingToId": 39,
          "comment": "@the_overlord Hmm",
          "createdAt": "2023-07-20T14:05:55.000Z",
          "likeCount": 0,
          "replyCount": 0,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        },
        {
          "id": 41,
          "postId": 10,
          "replyingToId": 39,
          "comment": "@the_overlord Ohh",
          "createdAt": "2023-07-13T14:31:46.000Z",
          "likeCount": 0,
          "replyCount": 1,
          "isLiked": 0,
          "user": {
            "id": 1,
            "username": "the_overlord",
            "profileImage": {
              "id": 52,
              "baseScale": "1.729451143053918",
              "pinchScale": "1",
              "translateX": "-7.0149733501274305",
              "translateY": "15.782304906909268",
              "originContainerWidth": "252.1904754638672",
              "originContainerHeight": "251.8095245361328",
              "aspectRatio": 1.38378,
              "thumbnails": [
                {
                  "id": 198,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490",
                  "height": 185,
                  "width": 256
                },
                {
                  "id": 199,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491",
                  "height": 371,
                  "width": 512
                },
                {
                  "id": 200,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490",
                  "height": 1334,
                  "width": 1842
                }
              ]
            }
          }
        }
      ],
      "nextParams": {
        "postCommentId": "39",
        "createdAt": "2023-07-13T14:31:46.000Z"
      }
    }

    const cache1 = { "thumbnail": { "198": { "id": 198, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490", "height": 185, "width": 256 }, "199": { "id": 199, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491", "height": 371, "width": 512 }, "200": { "id": 200, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490", "height": 1334, "width": 1842 } }, "image": { "52": { "id": 52, "baseScale": "1.729451143053918", "pinchScale": "1", "translateX": "-7.0149733501274305", "translateY": "15.782304906909268", "originContainerWidth": "252.1904754638672", "originContainerHeight": "251.8095245361328", "aspectRatio": 1.38378, "thumbnails": [198, 199, 200] } }, "user": { "1": { "id": 1, "username": "the_overlord", "profileImage": 52 } }, "postComment": { "31": { "id": 31, "postId": 10, "replyingToId": null, "comment": "Ok", "createdAt": "2023-07-11T16:17:03.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "32": { "id": 32, "postId": 10, "replyingToId": null, "comment": "I", "createdAt": "2023-07-11T16:17:15.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "33": { "id": 33, "postId": 10, "replyingToId": null, "comment": "Huh", "createdAt": "2023-07-11T16:19:14.000Z", "likeCount": 1, "replyCount": 0, "isLiked": 0, "user": 1 }, "34": { "id": 34, "postId": 10, "replyingToId": null, "comment": "Why", "createdAt": "2023-07-11T16:21:06.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "35": { "id": 35, "postId": 10, "replyingToId": null, "comment": "Where", "createdAt": "2023-07-11T16:21:19.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "36": { "id": 36, "postId": 10, "replyingToId": null, "comment": "Ohh!!\n\n\n\nNice!  ❤️", "createdAt": "2023-07-11T16:21:50.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "37": { "id": 37, "postId": 10, "replyingToId": null, "comment": "Muah! ♥️", "createdAt": "2023-07-12T13:16:54.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "38": { "id": 38, "postId": 10, "replyingToId": null, "comment": "Hey there How are you? @joshua", "createdAt": "2023-07-12T15:25:47.000Z", "likeCount": 0, "replyCount": 8, "isLiked": 0, "user": 1 }, "39": { "id": 39, "postId": 10, "replyingToId": null, "comment": "Hey @the_overlord How are you?", "createdAt": "2023-07-12T16:17:51.000Z", "likeCount": 0, "replyCount": 3, "isLiked": 0, "user": 1 }, "40": { "id": 40, "postId": 10, "replyingToId": null, "comment": "@the_overlord ", "createdAt": "2023-07-12T16:45:48.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 } } }

    const cache = toModel({
      currentCache: cache1,
      initialTable: "postComment",
      payload: data2.comments,
      model
    })

    const result = model.get(
      "postComment",
      JSON.parse(JSON.stringify(cache)),
      {
        id: 30,
        user: operation.join()
      },
      {
        user: ["id", "username"],
        postComment: ["user", "createdAt"],
      }
    )


    // const fetch = async (...args: any[]) => {
    //   // const next = args[0];
    //   // if (next) return Promise.resolve(data2)
    //   return Promise.resolve({
    //     comments: [...data1.comments, ...data3.comments],
    //     nextParams: data1.nextParams
    //   })
    // };

    // const { result } = renderHook(() => (
    //   useInfiniteQuery({
    //     table: "postComment",
    //     get: {
    //       fetch: (nextParams: any) => fetch(nextParams),
    //       where: {
    //         postId: 10,
    //         replyingToId: operation.join(v => v === null),
    //         user: {
    //           id: operation.join(),
    //           profileImage: {
    //             id: operation.join(),
    //             thumbnails: operation.join()
    //           }
    //         }
    //       }
    //     },
    //     getData: result => result.comments,
    //     getNextPageParams: result => result.nextParams,
    //     getNextPageKey: result => result.nextParams?.createdAt,
    //   })
    // ), { wrapper: largeWrapper });

    // await waitFor(() => {
    //   expect(result.current.result).toBe(null)
    // })


    // await waitFor(() => {
    //   expect(result.current.result.length).toBe(10)
    // })

    // await act(() => result.current.fetchNextPage())

    // await waitFor(() => {
    //   console.log(result.current.result[result.current.result.length - 1])
    //   expect(result.current.result.length).toBe(20)
    // })

  });

})