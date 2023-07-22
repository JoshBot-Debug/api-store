import { render, renderHook, waitFor } from "@testing-library/react";
import APIStore from "../APIStore";
import { createModel, createTable, operation } from "../model";
import { useInfiniteQuery } from "../useInfiniteQuery";
import { useMutation } from "../useMutation";
import { fakeFetch } from "./test-utils";


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


const wrapper = ({ children }: React.PropsWithChildren) => <APIStore model={model}>{children}</APIStore>


it("useInfiniteQuery where clause, join test.", async () => {

  const allUsers = Object.values(users);

  const {result} = renderHook(() => (
    useInfiniteQuery({
      table: "user",
      get: {
        fetch: async () => Object.values(users),
        where: {
          gender: "female"
          // token: operation.join(),
          // email: operation.join(e => e !== "joshua@gmail.com")
        }
      },
      getData: r => r,
      getNextPageKey: () => null,
      getNextPageParams: () => null,
    })
  ), { wrapper })


  await waitFor(() => {
    
    console.log(result.current.result)
    expect(result.current.result.length).toBe(2)

  })


});