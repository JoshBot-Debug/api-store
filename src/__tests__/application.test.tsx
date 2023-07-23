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

    const postComment1 = {
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

    const postComment2 = {
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

    const postComment3 = {
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

    const postCommentCache = { "thumbnail": { "198": { "id": 198, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490", "height": 185, "width": 256 }, "199": { "id": 199, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491", "height": 371, "width": 512 }, "200": { "id": 200, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490", "height": 1334, "width": 1842 } }, "image": { "52": { "id": 52, "baseScale": "1.729451143053918", "pinchScale": "1", "translateX": "-7.0149733501274305", "translateY": "15.782304906909268", "originContainerWidth": "252.1904754638672", "originContainerHeight": "251.8095245361328", "aspectRatio": 1.38378, "thumbnails": [198, 199, 200] } }, "user": { "1": { "id": 1, "username": "the_overlord", "profileImage": 52 } }, "postComment": { "31": { "id": 31, "postId": 10, "replyingToId": null, "comment": "Ok", "createdAt": "2023-07-11T16:17:03.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "32": { "id": 32, "postId": 10, "replyingToId": null, "comment": "I", "createdAt": "2023-07-11T16:17:15.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "33": { "id": 33, "postId": 10, "replyingToId": null, "comment": "Huh", "createdAt": "2023-07-11T16:19:14.000Z", "likeCount": 1, "replyCount": 0, "isLiked": 0, "user": 1 }, "34": { "id": 34, "postId": 10, "replyingToId": null, "comment": "Why", "createdAt": "2023-07-11T16:21:06.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "35": { "id": 35, "postId": 10, "replyingToId": null, "comment": "Where", "createdAt": "2023-07-11T16:21:19.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "36": { "id": 36, "postId": 10, "replyingToId": null, "comment": "Ohh!!\n\n\n\nNice!  ❤️", "createdAt": "2023-07-11T16:21:50.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "37": { "id": 37, "postId": 10, "replyingToId": null, "comment": "Muah! ♥️", "createdAt": "2023-07-12T13:16:54.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 }, "38": { "id": 38, "postId": 10, "replyingToId": null, "comment": "Hey there How are you? @joshua", "createdAt": "2023-07-12T15:25:47.000Z", "likeCount": 0, "replyCount": 8, "isLiked": 0, "user": 1 }, "39": { "id": 39, "postId": 10, "replyingToId": null, "comment": "Hey @the_overlord How are you?", "createdAt": "2023-07-12T16:17:51.000Z", "likeCount": 0, "replyCount": 3, "isLiked": 0, "user": 1 }, "40": { "id": 40, "postId": 10, "replyingToId": null, "comment": "@the_overlord ", "createdAt": "2023-07-12T16:45:48.000Z", "likeCount": 0, "replyCount": 0, "isLiked": 0, "user": 1 } } }


    const posts = {
      "posts": [
        {
          "id": 10,
          "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?",
          "contentRating": "R18",
          "createdAt": "2023-06-26T14:24:04.000Z",
          "likeCount": 2,
          "commentsCount": 41,
          "isLiked": 1,
          "images": [
            {
              "id": 54,
              "baseScale": "1",
              "pinchScale": "1",
              "translateX": "0",
              "translateY": "0",
              "originContainerWidth": "768",
              "originContainerHeight": "460",
              "aspectRatio": 0.890625,
              "thumbnails": [
                {
                  "id": 206,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-1.128.jpeg",
                  "height": 128,
                  "width": 114
                },
                {
                  "id": 207,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-2.256.jpeg",
                  "height": 256,
                  "width": 228
                },
                {
                  "id": 208,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-3.512.jpeg",
                  "height": 512,
                  "width": 455
                },
                {
                  "id": 209,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-4.720.jpeg",
                  "height": 720,
                  "width": 640
                },
                {
                  "id": 210,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438223.0-0.original.jpeg",
                  "height": 1728,
                  "width": 1536
                }
              ]
            },
            {
              "id": 55,
              "baseScale": "1",
              "pinchScale": "1",
              "translateX": "0",
              "translateY": "0",
              "originContainerWidth": "768",
              "originContainerHeight": "460",
              "aspectRatio": 0.773438,
              "thumbnails": [
                {
                  "id": 211,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-1.128.jpeg",
                  "height": 128,
                  "width": 99
                },
                {
                  "id": 212,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-2.256.jpeg",
                  "height": 256,
                  "width": 198
                },
                {
                  "id": 213,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-3.512.jpeg",
                  "height": 512,
                  "width": 396
                },
                {
                  "id": 214,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-4.720.jpeg",
                  "height": 720,
                  "width": 557
                },
                {
                  "id": 215,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-0.original.jpeg",
                  "height": 1656,
                  "width": 1280
                }
              ]
            },
            {
              "id": 56,
              "baseScale": "1",
              "pinchScale": "1",
              "translateX": "0",
              "translateY": "0",
              "originContainerWidth": "768",
              "originContainerHeight": "460",
              "aspectRatio": 0.890625,
              "thumbnails": [
                {
                  "id": 216,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.2-1.128.jpeg",
                  "height": 128,
                  "width": 114
                },
                {
                  "id": 217,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.2-2.256.jpeg",
                  "height": 256,
                  "width": 228
                },
                {
                  "id": 218,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.2-3.512.jpeg",
                  "height": 512,
                  "width": 455
                },
                {
                  "id": 219,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.2-4.720.jpeg",
                  "height": 720,
                  "width": 640
                },
                {
                  "id": 220,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.2-0.original.jpeg",
                  "height": 1728,
                  "width": 1536
                }
              ]
            },
            {
              "id": 57,
              "baseScale": "1",
              "pinchScale": "1",
              "translateX": "0",
              "translateY": "0",
              "originContainerWidth": "768",
              "originContainerHeight": "460",
              "aspectRatio": 0.890625,
              "thumbnails": [
                {
                  "id": 221,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.3-1.128.jpeg",
                  "height": 128,
                  "width": 114
                },
                {
                  "id": 222,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.3-2.256.jpeg",
                  "height": 256,
                  "width": 228
                },
                {
                  "id": 223,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438228.3-3.512.jpeg",
                  "height": 512,
                  "width": 455
                },
                {
                  "id": 224,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438228.3-4.720.jpeg",
                  "height": 720,
                  "width": 640
                },
                {
                  "id": 225,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.3-0.original.jpeg",
                  "height": 1728,
                  "width": 1536
                }
              ]
            }
          ],
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
          "id": 9,
          "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?",
          "contentRating": "R18",
          "createdAt": "2023-06-25T15:03:16.000Z",
          "likeCount": 2,
          "commentsCount": 0,
          "isLiked": 1,
          "images": [
            {
              "id": 53,
              "baseScale": "1",
              "pinchScale": "1",
              "translateX": "0",
              "translateY": "0",
              "originContainerWidth": "768",
              "originContainerHeight": "460",
              "aspectRatio": 0.890625,
              "thumbnails": [
                {
                  "id": 201,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393873.0-1.128.jpeg",
                  "height": 128,
                  "width": 114
                },
                {
                  "id": 202,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393873.0-2.256.jpeg",
                  "height": 256,
                  "width": 228
                },
                {
                  "id": 203,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393873.0-3.512.jpeg",
                  "height": 512,
                  "width": 455
                },
                {
                  "id": 204,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393874.0-4.720.jpeg",
                  "height": 720,
                  "width": 640
                },
                {
                  "id": 205,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393872.0-0.original.jpeg",
                  "height": 1728,
                  "width": 1536
                }
              ]
            }
          ],
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
          "id": 8,
          "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?",
          "contentRating": "R18",
          "createdAt": "2023-06-21T16:13:41.000Z",
          "likeCount": 1,
          "commentsCount": 0,
          "isLiked": 0,
          "images": [
            {
              "id": 47,
              "baseScale": "1.4",
              "pinchScale": "1",
              "translateX": "-17.857142857142858",
              "translateY": "65.71428571428572",
              "originContainerWidth": "720",
              "originContainerHeight": "460",
              "aspectRatio": 0.890625,
              "thumbnails": [
                {
                  "id": 181,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-1.128.jpeg",
                  "height": 128,
                  "width": 114
                },
                {
                  "id": 182,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-2.256.jpeg",
                  "height": 256,
                  "width": 228
                },
                {
                  "id": 183,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-3.512.jpeg",
                  "height": 512,
                  "width": 455
                },
                {
                  "id": 184,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-4.720.jpeg",
                  "height": 720,
                  "width": 640
                },
                {
                  "id": 185,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014092.0-0.original.jpeg",
                  "height": 1728,
                  "width": 1536
                }
              ]
            }
          ],
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
          "id": 7,
          "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?",
          "contentRating": "R18",
          "createdAt": "2023-06-21T13:48:10.000Z",
          "likeCount": 2,
          "commentsCount": 0,
          "isLiked": 1,
          "images": [
            {
              "id": 46,
              "baseScale": "2.524666899883316",
              "pinchScale": "1",
              "translateX": "-109.35149362634411",
              "translateY": "20.182932014204848",
              "originContainerWidth": "411.4285583496094",
              "originContainerHeight": "403.047607421875",
              "aspectRatio": 1.77778,
              "thumbnails": [
                {
                  "id": 176,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-1.128.jpeg",
                  "height": 72,
                  "width": 128
                },
                {
                  "id": 177,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-2.256.jpeg",
                  "height": 144,
                  "width": 256
                },
                {
                  "id": 178,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-3.512.jpeg",
                  "height": 288,
                  "width": 512
                },
                {
                  "id": 179,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-4.720.jpeg",
                  "height": 405,
                  "width": 720
                },
                {
                  "id": 180,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288546.0-0.original.jpeg",
                  "height": 720,
                  "width": 1280
                }
              ]
            }
          ],
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
          "id": 6,
          "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?",
          "contentRating": "SFK",
          "createdAt": "2023-06-20T17:02:23.000Z",
          "likeCount": 2,
          "commentsCount": 0,
          "isLiked": 1,
          "images": [
            {
              "id": 43,
              "baseScale": "1.4",
              "pinchScale": "1",
              "translateX": "-2.142857142857143",
              "translateY": "62.85714285714286",
              "originContainerWidth": "720",
              "originContainerHeight": "460",
              "aspectRatio": 0.710938,
              "thumbnails": [
                {
                  "id": 161,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-1.128.jpeg",
                  "height": 128,
                  "width": 91
                },
                {
                  "id": 162,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-2.256.jpeg",
                  "height": 256,
                  "width": 181
                },
                {
                  "id": 163,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-3.512.jpeg",
                  "height": 512,
                  "width": 362
                },
                {
                  "id": 164,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-4.720.jpeg",
                  "height": 720,
                  "width": 509
                },
                {
                  "id": 165,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539759.0-0.original.jpeg",
                  "height": 1811,
                  "width": 1280
                }
              ]
            },
            {
              "id": 44,
              "baseScale": "1.4",
              "pinchScale": "1",
              "translateX": "-93.57142857142858",
              "translateY": "32.142857142857146",
              "originContainerWidth": "720",
              "originContainerHeight": "460",
              "aspectRatio": 1.6,
              "thumbnails": [
                {
                  "id": 166,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-1.128.jpeg",
                  "height": 80,
                  "width": 128
                },
                {
                  "id": 167,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-2.256.jpeg",
                  "height": 160,
                  "width": 256
                },
                {
                  "id": 168,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-3.512.jpeg",
                  "height": 320,
                  "width": 512
                },
                {
                  "id": 169,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.1-4.720.jpeg",
                  "height": 449,
                  "width": 720
                },
                {
                  "id": 170,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-0.original.jpeg",
                  "height": 1200,
                  "width": 1923
                }
              ]
            },
            {
              "id": 45,
              "baseScale": "1.4",
              "pinchScale": "1",
              "translateX": "60.714285714285715",
              "translateY": "22.142857142857146",
              "originContainerWidth": "720",
              "originContainerHeight": "460",
              "aspectRatio": 1.77778,
              "thumbnails": [
                {
                  "id": 171,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-1.128.jpeg",
                  "height": 72,
                  "width": 128
                },
                {
                  "id": 172,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-2.256.jpeg",
                  "height": 144,
                  "width": 256
                },
                {
                  "id": 173,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-3.512.jpeg",
                  "height": 288,
                  "width": 512
                },
                {
                  "id": 174,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-4.720.jpeg",
                  "height": 405,
                  "width": 720
                },
                {
                  "id": 175,
                  "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-0.original.jpeg",
                  "height": 1238,
                  "width": 2200
                }
              ]
            }
          ],
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
        }
      ],
      "nextParams": {
        "createdAt": "2023-06-20T17:02:23.000Z"
      }
    }

    const postCache = { "thumbnail": { "161": { "id": 161, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-1.128.jpeg", "height": 128, "width": 91 }, "162": { "id": 162, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-2.256.jpeg", "height": 256, "width": 181 }, "163": { "id": 163, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-3.512.jpeg", "height": 512, "width": 362 }, "164": { "id": 164, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.0-4.720.jpeg", "height": 720, "width": 509 }, "165": { "id": 165, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539759.0-0.original.jpeg", "height": 1811, "width": 1280 }, "166": { "id": 166, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-1.128.jpeg", "height": 80, "width": 128 }, "167": { "id": 167, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-2.256.jpeg", "height": 160, "width": 256 }, "168": { "id": 168, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-3.512.jpeg", "height": 320, "width": 512 }, "169": { "id": 169, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.1-4.720.jpeg", "height": 449, "width": 720 }, "170": { "id": 170, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539761.1-0.original.jpeg", "height": 1200, "width": 1923 }, "171": { "id": 171, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-1.128.jpeg", "height": 72, "width": 128 }, "172": { "id": 172, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-2.256.jpeg", "height": 144, "width": 256 }, "173": { "id": 173, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-3.512.jpeg", "height": 288, "width": 512 }, "174": { "id": 174, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-4.720.jpeg", "height": 405, "width": 720 }, "175": { "id": 175, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687280539762.2-0.original.jpeg", "height": 1238, "width": 2200 }, "176": { "id": 176, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-1.128.jpeg", "height": 72, "width": 128 }, "177": { "id": 177, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-2.256.jpeg", "height": 144, "width": 256 }, "178": { "id": 178, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-3.512.jpeg", "height": 288, "width": 512 }, "179": { "id": 179, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288548.0-4.720.jpeg", "height": 405, "width": 720 }, "180": { "id": 180, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687355288546.0-0.original.jpeg", "height": 720, "width": 1280 }, "181": { "id": 181, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-1.128.jpeg", "height": 128, "width": 114 }, "182": { "id": 182, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-2.256.jpeg", "height": 256, "width": 228 }, "183": { "id": 183, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-3.512.jpeg", "height": 512, "width": 455 }, "184": { "id": 184, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014093.0-4.720.jpeg", "height": 720, "width": 640 }, "185": { "id": 185, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/post.1687364014092.0-0.original.jpeg", "height": 1728, "width": 1536 }, "186": { "id": 186, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/profilePhoto.256.jpeg?1687444436097", "height": 256, "width": 199 }, "187": { "id": 187, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/profilePhoto.512.jpeg?1687444436097", "height": 512, "width": 398 }, "188": { "id": 188, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/profilePhoto.original.jpeg?1687444436095", "height": 900, "width": 700 }, "198": { "id": 198, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.256.jpeg?1687545543490", "height": 185, "width": 256 }, "199": { "id": 199, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.512.jpeg?1687545543491", "height": 371, "width": 512 }, "200": { "id": 200, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/1/profilePhoto.original.jpeg?1687545543490", "height": 1334, "width": 1842 }, "201": { "id": 201, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393873.0-1.128.jpeg", "height": 128, "width": 114 }, "202": { "id": 202, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393873.0-2.256.jpeg", "height": 256, "width": 228 }, "203": { "id": 203, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393873.0-3.512.jpeg", "height": 512, "width": 455 }, "204": { "id": 204, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393874.0-4.720.jpeg", "height": 720, "width": 640 }, "205": { "id": 205, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687705393872.0-0.original.jpeg", "height": 1728, "width": 1536 }, "206": { "id": 206, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-1.128.jpeg", "height": 128, "width": 114 }, "207": { "id": 207, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-2.256.jpeg", "height": 256, "width": 228 }, "208": { "id": 208, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-3.512.jpeg", "height": 512, "width": 455 }, "209": { "id": 209, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438225.0-4.720.jpeg", "height": 720, "width": 640 }, "210": { "id": 210, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438223.0-0.original.jpeg", "height": 1728, "width": 1536 }, "211": { "id": 211, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-1.128.jpeg", "height": 128, "width": 99 }, "212": { "id": 212, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-2.256.jpeg", "height": 256, "width": 198 }, "213": { "id": 213, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-3.512.jpeg", "height": 512, "width": 396 }, "214": { "id": 214, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-4.720.jpeg", "height": 720, "width": 557 }, "215": { "id": 215, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.1-0.original.jpeg", "height": 1656, "width": 1280 }, "216": { "id": 216, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.2-1.128.jpeg", "height": 128, "width": 114 }, "217": { "id": 217, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.2-2.256.jpeg", "height": 256, "width": 228 }, "218": { "id": 218, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.2-3.512.jpeg", "height": 512, "width": 455 }, "219": { "id": 219, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.2-4.720.jpeg", "height": 720, "width": 640 }, "220": { "id": 220, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438226.2-0.original.jpeg", "height": 1728, "width": 1536 }, "221": { "id": 221, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.3-1.128.jpeg", "height": 128, "width": 114 }, "222": { "id": 222, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.3-2.256.jpeg", "height": 256, "width": 228 }, "223": { "id": 223, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438228.3-3.512.jpeg", "height": 512, "width": 455 }, "224": { "id": 224, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438228.3-4.720.jpeg", "height": 720, "width": 640 }, "225": { "id": 225, "uri": "https://isekaied-photos.us-southeast-1.linodeobjects.com/2/post.1687789438227.3-0.original.jpeg", "height": 1728, "width": 1536 } }, "image": { "43": { "id": 43, "baseScale": "1.4", "pinchScale": "1", "translateX": "-2.142857142857143", "translateY": "62.85714285714286", "originContainerWidth": "720", "originContainerHeight": "460", "aspectRatio": 0.710938, "thumbnails": [161, 162, 163, 164, 165] }, "44": { "id": 44, "baseScale": "1.4", "pinchScale": "1", "translateX": "-93.57142857142858", "translateY": "32.142857142857146", "originContainerWidth": "720", "originContainerHeight": "460", "aspectRatio": 1.6, "thumbnails": [166, 167, 168, 169, 170] }, "45": { "id": 45, "baseScale": "1.4", "pinchScale": "1", "translateX": "60.714285714285715", "translateY": "22.142857142857146", "originContainerWidth": "720", "originContainerHeight": "460", "aspectRatio": 1.77778, "thumbnails": [171, 172, 173, 174, 175] }, "46": { "id": 46, "baseScale": "2.524666899883316", "pinchScale": "1", "translateX": "-109.35149362634411", "translateY": "20.182932014204848", "originContainerWidth": "411.4285583496094", "originContainerHeight": "403.047607421875", "aspectRatio": 1.77778, "thumbnails": [176, 177, 178, 179, 180] }, "47": { "id": 47, "baseScale": "1.4", "pinchScale": "1", "translateX": "-17.857142857142858", "translateY": "65.71428571428572", "originContainerWidth": "720", "originContainerHeight": "460", "aspectRatio": 0.890625, "thumbnails": [181, 182, 183, 184, 185] }, "48": { "id": 48, "baseScale": "1.4", "pinchScale": "1", "translateX": "-3.5714285714285716", "translateY": "28.571428571428573", "originContainerWidth": "252", "originContainerHeight": "252", "aspectRatio": 0.777344, "thumbnails": [186, 187, 188] }, "52": { "id": 52, "baseScale": "1.729451143053918", "pinchScale": "1", "translateX": "-7.0149733501274305", "translateY": "15.782304906909268", "originContainerWidth": "252.1904754638672", "originContainerHeight": "251.8095245361328", "aspectRatio": 1.38378, "thumbnails": [198, 199, 200] }, "53": { "id": 53, "baseScale": "1", "pinchScale": "1", "translateX": "0", "translateY": "0", "originContainerWidth": "768", "originContainerHeight": "460", "aspectRatio": 0.890625, "thumbnails": [201, 202, 203, 204, 205] }, "54": { "id": 54, "baseScale": "1", "pinchScale": "1", "translateX": "0", "translateY": "0", "originContainerWidth": "768", "originContainerHeight": "460", "aspectRatio": 0.890625, "thumbnails": [206, 207, 208, 209, 210] }, "55": { "id": 55, "baseScale": "1", "pinchScale": "1", "translateX": "0", "translateY": "0", "originContainerWidth": "768", "originContainerHeight": "460", "aspectRatio": 0.773438, "thumbnails": [211, 212, 213, 214, 215] }, "56": { "id": 56, "baseScale": "1", "pinchScale": "1", "translateX": "0", "translateY": "0", "originContainerWidth": "768", "originContainerHeight": "460", "aspectRatio": 0.890625, "thumbnails": [216, 217, 218, 219, 220] }, "57": { "id": 57, "baseScale": "1", "pinchScale": "1", "translateX": "0", "translateY": "0", "originContainerWidth": "768", "originContainerHeight": "460", "aspectRatio": 0.890625, "thumbnails": [221, 222, 223, 224, 225] } }, "user": { "1": { "id": 1, "username": "the_overlord", "profileImage": 52 }, "2": { "id": 2, "username": "qwerty", "profileImage": 48 } }, "post": { "6": { "id": 6, "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?", "contentRating": "SFK", "createdAt": "2023-06-20T17:02:23.000Z", "likeCount": 2, "commentsCount": 0, "isLiked": 1, "images": [43, 44, 45], "user": 2 }, "7": { "id": 7, "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?", "contentRating": "R18", "createdAt": "2023-06-21T13:48:10.000Z", "likeCount": 2, "commentsCount": 0, "isLiked": 1, "images": [46], "user": 1 }, "8": { "id": 8, "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?", "contentRating": "R18", "createdAt": "2023-06-21T16:13:41.000Z", "likeCount": 1, "commentsCount": 0, "isLiked": 0, "images": [47], "user": 1 }, "9": { "id": 9, "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?", "contentRating": "R18", "createdAt": "2023-06-25T15:03:16.000Z", "likeCount": 2, "commentsCount": 0, "isLiked": 1, "images": [53], "user": 2 }, "10": { "id": 10, "caption": "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Alias esse rem perferendis accusamus dolore itaque expedita distinctio laborum. Distinctio fugit delectus quas impedit alias rerum tenetur! Commodi eaque repellat molestiae? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sit, officiis. Molestiae perspiciatis dolorem pariatur, nisi quae facere consequuntur fuga a iusto neque ipsa enim ducimus, minima similique, consectetur ut maxime?", "contentRating": "R18", "createdAt": "2023-06-26T14:24:04.000Z", "likeCount": 2, "commentsCount": 41, "isLiked": 1, "images": [54, 55, 56, 57], "user": 2 } } }

    const cache = toModel({
      currentCache: postCache,
      initialTable: "post",
      payload: [],
      model
    })

    const result = model.get(
      "post",
      JSON.parse(JSON.stringify(cache)),
      {
        id: 10,
        images: {
          id: operation.join(),
          thumbnails: operation.join()
        }
      },
      {
        post: ["id", "images", "user"],
        images: ["id", "thumbnails"],
        thumbnails: ["id", "height"],
      }
    )
    // operation.join()

    console.log(result.images[0])


    // console.log(result?.user.profileImage)


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