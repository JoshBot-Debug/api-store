import { createRelationalObject, createRelationalObjectIndex, createStore } from "@jjmyers/object-relationship-store";
import { RelationalStoreProvider, useStoreSelect, useStoreIndex } from "..";
import { act, renderHook } from "@testing-library/react";
import { posts } from "./data";

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


describe("Should create a store", () => {


  it("should get data from a store", async () => {

    store.upsert(posts, { indexes: ["homeFeed"] })

    const { result } = renderHook(() => (
      useStoreIndex("homeFeed", {
        post: {
          from: "post",
          fields: ["id"],
        }
      })
    ), { wrapper });

    expect(result.current?.length).toBe(5)

    act(() => store.upsert({id: 5, caption: "Hey"}, { indexes: ["homeFeed"] }))

    expect(result.current?.length).toBe(6)

  })


})