import { render, renderHook, screen, waitFor } from "@testing-library/react";
import APIStore from "../Provider";
import { fakeFetch, useRenderCount } from "./test-utils";
import { createTable, createModel } from "../model";
import { useQuery } from "../useQuery";
import { act } from "react-dom/test-utils";

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
        get: { result: Object.values(users) }
      })
    ), { wrapper });

    expect(result.current.result).toStrictEqual(Object.values(users));
  });


});


describe("useQuery hook component tests", () => {


  it("Should rerender only the component where data changes", async () => {

    function Dob(props: { id: number; }) {

      const store = useQuery<User>({
        table: "user",
        get: {
          where: { id: props.id }
        },
        fields: { user: ["dob"] },
        enabled: false
      })

      const count = useRenderCount(store)

      return (
        <>
          <p data-testid={`count-dob-${props.id}`} >Count({props.id}): {count}</p>
          <p data-testid="profile-dob">{store.result?.dob}</p>
        </>
      )
    }

    function Profile(props: { id: number; }) {

      const store = useQuery<User>({
        table: "user",
        get: {
          where: { id: props.id }
        },
        enabled: false,
        fields: {
          user: ["username"]
        }
      })

      const count = useRenderCount(store)

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

      const count = useRenderCount(store)

      const handleButtonClick = () => store.refetch(count);

      return (
        <div>
          <p data-testid={`dob-${props.id}`} >{store.result?.dob}</p>
          <p data-testid={`count-${props.id}`} >Count({props.id}): {count}</p>
          <button data-testid={`refetch-${props.id}`} onClick={handleButtonClick}>Update {props.id}</button>
        </div>
      );
    }

    function UserListComponent() {

      const store = useQuery({
        table: "user",
        get: { result: Object.values(users) },
        fields: {
          user: ["id", "dob", "username"],
        }
      })

      const count = useRenderCount(store)

      const renderItem = (user: User, index: number) => user && <UserComponent key={index} id={user.id} />

      return (
        <>
          <p data-testid={`count-list`} >Count(list): {count}</p>
          {store.result?.map(renderItem)}
        </>
      )
    }

    const result = render(
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


});