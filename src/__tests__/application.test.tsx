import { act, renderHook, waitFor } from "@testing-library/react";
import { posts } from "./data";
import { RelationalStoreProvider, createRelationalObject, createRelationalObjectIndex, createStore, useStoreIndex } from "..";
import { useQuery } from "../useQuery";
import { fakeFetch, fakePaginatingFetch } from "./test-utils";
import { useInfiniteQuery } from "../useInfiniteQuery";
import { useMutation } from "../useMutation";

const user = createRelationalObject("user", { id: "number" });
const image = createRelationalObject("image", { id: "number" });
const thumbnail = createRelationalObject("thumbnail", { id: "number" });
const post = createRelationalObject("post", { id: "number" });

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
    'user': o => !!o.username,
    'image': o => !!o.baseScale,
    'thumbnail': o => !!o.uri,
    'post': o => !!o.caption,
  }
});


const wrapper = ({ children }: React.PropsWithChildren) => {
  return <RelationalStoreProvider store={store}>{children}</RelationalStoreProvider>
}


it("should get data from a store", async () => {

  store.upsert(posts, { indexes: [{ index: "homeFeed", key: "1" }] })

  const { result } = renderHook(() => (
    useStoreIndex("homeFeed-1", {
      post: {
        from: "post",
        fields: ["id"],
      }
    })
  ), { wrapper });

  expect(result.current?.length).toBe(5)

  act(() => store.upsert({ id: 5, caption: "Hey" }, { indexes: [{ index: "homeFeed", key: "1" }] }))

  expect(result.current?.length).toBe(6)

})


it("should get data from useQuery", async () => {

  store.purge()

  store.upsert(posts, { indexes: [{ index: "homeFeed", key: "1" }] })

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

  store.upsert(posts, { indexes: [{ index: "homeFeed", key: "1" }] })

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
    useMutation({
      mutate: () => fakeFetch({ id: 10, createdAt: "Updated", caption: "Hey" })
    })
  ), { wrapper });

  await act(() => r2.result.current.mutate())

  await waitFor(() => expect(r1.result.current.state).toStrictEqual({ id: 10, createdAt: "Updated" }))
})


it("should mutate using __identify__", async () => {

  store.purge()

  store.upsert(posts, { indexes: [{ index: "homeFeed", key: "1" }] })

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
    useMutation({
      mutate: async () => {
        const result = await fakeFetch({ id: 10, createdAt: "Updated" });
        return { ...result, __identify__: "post" }
      }
    })
  ), { wrapper });

  // Should use __identify__ and succeed in updating
  await act(() => r2.result.current.mutate())
  await waitFor(() => expect(r1.result.current.state).toStrictEqual({ id: 10, createdAt: "Updated" }))
})
