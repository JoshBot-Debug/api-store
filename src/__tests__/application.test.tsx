import React from "react";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import APIStore from "../APIStore";
import { fakeFetch, fakePaginatingFetch, useRenderCount } from "./test-utils";
import { createTable, createModel } from "../model";
import { useQuery } from "../useQuery";
import { act } from "react-dom/test-utils";
import { useMutation } from "../useMutation";
import { useInfiniteQuery } from "../useInfiniteQuery";
import { UseAPIStore } from "../types";

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

const token = createTable("token", {
  token: "string",
}, { pk: "user" })

const user = createTable("user", {
  id: "number",
  username: "string",
  email: "string",
  gender: "string",
  dob: "string",
});

const image = createTable("image", {
  id: "number",
  aspectRatio: "number",
})

const thumbnail = createTable("thumbnail", {
  id: "number",
  src: "string",
})

token.hasOne(user)

user.hasOne(token)
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
    id: 10,
    username: "Joshua",
    email: "joshua@gmail.com",
    gender: "male",
    dob: "21-02-1998",
    token: {
      user: 10,
      token: "<secret>"
    }
  },
  11: {
    id: 11,
    username: "Hannah",
    email: "hannah@gmail.com",
    gender: "female",
    dob: "26-01-2000",
    token: 11,
  },
  12: {
    id: 12,
    username: "May",
    email: "amy@gmail.com",
    gender: "female",
    dob: "26-01-2000",
    token: 12,
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

    expect(result.current.result).toStrictEqual({ ...data, user: { ...data.user, token: 10 } })
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

    expect(result.current.result).toStrictEqual([users[11], users[12]]);
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

    const fetch = (rand: any) => fakeFetch({ ...data, dob: `<updated-dob> [${rand}]` }, 100)

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

})