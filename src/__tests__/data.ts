import { UseAPIStore } from "../types";
import { User } from "./model";

export const DATA = {

  users: <{ [page: number]: { users: User[], nextParams: { page: number } | null } }>{
    1: {
      users: [
        { id: 1, username: "John" },
        { id: 2, username: "Jane" },
      ],
      nextParams: {
        page: 2
      }
    },
    2: {
      users: [
        { id: 3, username: "Tom" },
        { id: 4, username: "Harry" },
      ],
      nextParams: {
        page: 3
      }
    },
    3: {
      users: [
        { id: 5, username: "Patrick" },
        { id: 6, username: "Bob" },
      ],
      nextParams: null
    }
  }

}