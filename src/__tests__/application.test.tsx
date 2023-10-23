import { act, renderHook, waitFor } from "@testing-library/react";
import { posts } from "./data";
import { RelationalStoreProvider, createRelationalObject, createRelationalObjectIndex, createStore, useStoreIndex, withOptions } from "..";
import { useQuery } from "../useQuery";
import { fakeFetch, fakePaginatingFetch } from "./test-utils";
import { useInfiniteQuery } from "../useInfiniteQuery";
import { useMutation } from "../useMutation";

const user = createRelationalObject("user");
const image = createRelationalObject("image");
const thumbnail = createRelationalObject("thumbnail");
const post = createRelationalObject("post");

image.hasMany(thumbnail, "thumbnails")
user.hasOne(image, "profileImage")
post.hasMany(image, "images")
post.hasOne(user)
user.hasMany(post, "posts")
image.hasOne(user)
image.hasOne(post)

const homeFeed = createRelationalObjectIndex("homeFeed", [post])
const users = createRelationalObjectIndex("users", [user])

const store = createStore({
  relationalCreators: [user, post, image, thumbnail],
  indexes: [homeFeed, users],
  identifier: {
    'user': o => "username" in o,
    'image': o => "aspectRatio" in o,
    'thumbnail': o => "uri" in o,
    'post': o => "caption" in o,
  }
});


const wrapper = ({ children }: React.PropsWithChildren) => {
  return <RelationalStoreProvider store={store}>{children}</RelationalStoreProvider>
}


it("should get data from a store", async () => {

  store.mutate(withOptions(posts, { __indexes__: ["homeFeed-1"] }))

  const { result } = renderHook(() => (
    useStoreIndex("homeFeed-1", {
      post: {
        from: "post",
        fields: ["id"],
      }
    })
  ), { wrapper });

  expect(result.current?.length).toBe(5)

  act(() => store.mutate(withOptions({ id: 5 }, { __identify__: "post", __indexes__: ["homeFeed-1"] })))

  expect(result.current?.length).toBe(6)

})


it("should get data from useQuery", async () => {

  store.purge()

  store.mutate(posts)

  const r1 = renderHook(() => (
    useQuery({
      select: {
        from: "post",
        // @ts-ignore
        fields: ["id", "createdAt"],
        where: { id: 10 }
      },
    })
  ), { wrapper });


  expect(r1.result.current.state).toStrictEqual({ id: 10, createdAt: "2023-06-26T14:24:04.000Z" })

  const r2 = renderHook(() => (
    useQuery({
      select: {
        from: "post",
        // @ts-ignore
        fields: ["id", "createdAt"],
        where: { id: 10 }
      },
      fetch: () => fakeFetch({ id: 10, createdAt: "Updated", caption: "Hey" })
    })
  ), { wrapper });

  await waitFor(() => expect(r2.result.current.state).toStrictEqual({ id: 10, createdAt: "Updated" }))
  await waitFor(() => expect(r2.result.current.result).toStrictEqual({ id: 10, createdAt: "Updated", caption: "Hey" }))
})


it("should get data from useInfiniteQuery", async () => {

  store.purge()

  const r1 = renderHook(() => (
    useInfiniteQuery({
      index: "homeFeed-1",
      getData: r => r.data,
      getNextPageParams: r => r.nextParams,
      fetch: nextParams => fakePaginatingFetch(posts, nextParams)
    })
  ), { wrapper });

  await waitFor(() => expect(r1.result.current.state?.length).toStrictEqual(2))
  await waitFor(() => expect(r1.result.current.nextPageParams).toStrictEqual({ createdAt: "2023-06-20T17:02:23.100Z" }))

  await act(() => r1.result.current.fetchNextPage())
  await waitFor(() => expect(r1.result.current.state?.length).toStrictEqual(4))
  await waitFor(() => expect(r1.result.current.nextPageParams).toStrictEqual({ createdAt: "2023-06-20T17:02:23.200Z" }))

  await act(() => r1.result.current.fetchNextPage())
  await waitFor(() => expect(r1.result.current.state?.length).toStrictEqual(5))
})


it("should mutate useQuery when useMutation is called", async () => {

  store.purge()

  store.mutate(posts)

  const r1 = renderHook(() => (
    useQuery({
      select: {
        from: "post",
        // @ts-ignore
        fields: ["id", "createdAt"],
        where: { id: 10 }
      },
    })
  ), { wrapper });

  expect(r1.result.current.state).toStrictEqual({ id: 10, createdAt: "2023-06-26T14:24:04.000Z" })

  const r2 = renderHook(() => (
    useMutation({ mutate: () => fakeFetch({ id: 10, createdAt: "Updated", __identify__: "post" }) })
  ), { wrapper });

  await act(() => r2.result.current.mutate())

  await waitFor(() => expect(r1.result.current.state).toStrictEqual({ id: 10, createdAt: "Updated" }))
})


it("should mutate using __identify__", async () => {

  store.purge()

  store.mutate(posts)

  const r1 = renderHook(() => (
    useQuery({
      select: {
        from: "post",
        // @ts-ignore
        fields: ["id", "createdAt"],
        where: { id: 10 }
      },
    })
  ), { wrapper });

  expect(r1.result.current.state).toStrictEqual({ id: 10, createdAt: "2023-06-26T14:24:04.000Z" })

  const r2 = renderHook(() => (
    useMutation({ mutate: () => fakeFetch({ id: 10, createdAt: "Updated", __identify__: "post" }) })
  ), { wrapper });

  // Should use __identify__ and succeed in updating
  await act(() => r2.result.current.mutate())
  await waitFor(() => expect(r1.result.current.state).toStrictEqual({ id: 10, createdAt: "Updated" }))
})



it("should mutate nothing on an empty array response", async () => {

  store.purge();

  store.mutate(posts);

  const r2 = renderHook(() => (
    useMutation({
      mutate: async () => {
        return []
      }
    })
  ), { wrapper });

  await act(() => r2.result.current.mutate())
})