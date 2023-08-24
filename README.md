# API store

### This is an implimentation of https://www.npmjs.com/package/@jjmyers/object-relationship-store

## Step 1.

### **Define your objects and their relationship**
```ts

import {
  ORS,                          // Ref object-relationship-store
  createStore,                  // Ref object-relationship-store
  createRelationalObject,       // Ref object-relationship-store
  createRelationalObjectIndex,  // Ref object-relationship-store
  withOptions,                  // Ref object-relationship-store
  UseAPIStore,
  useStore,                     // Ref object-relationship-store ReturnType<typeof createStore>
  useStoreSelect,               // Ref object-relationship-store store.select()
  useStoreIndex,                // Ref object-relationship-store store.selectIndex()
  RelationalStoreProvider,
  useMutation,
  useQuery,
  useInfiniteQuery
} from "@jjmyers/api-store"

/**
 * To setup the store and all store related operations
 * Check object-relationship-store
 * https://www.npmjs.com/package/@jjmyers/object-relationship-store
 */

// Once you have gone through object-relationship-store and you have created a store
const store = createStore()

```

## Step 2.

### **Wrap you application in RelationalStoreProvider**

```tsx
<RelationalStoreProvider store={store}>
  {children}
</RelationalStoreProvider>
```

## Step 4.

### **You're done!**
### **Use the following to get and set data.**

```ts

type From = "user" | "wishlist" | "product"

// Example useage
const query = useQuery<From, User, User>({
  
  // Enable fetch on mount, by default it's true
  // Optional
  // Default TRUE
  enabled: true,

  // Optionally add a fetch to get data on mount
  fetch: () => GetData.request({user: 10}),

  // Select the data from the fetch result that is the object we expect
  // Optional
  getData: (fetchResult) => fetchResult.user

  /**
   * The selector here is from object-relationship-store
   * https://www.npmjs.com/package/@jjmyers/object-relationship-store
   * 
   * This is the same selector object
   */
  select: {
    from: "user",
    where: { id: 10 },
    fields: ["id", "wishlist"],
    join: [{
      on: "wishlist",
      fields: ["id", "products"],
      join: [{ on: "products", fields: "*" }]
    }]
  }
})

const {
  state,      // A piece of state that was selected (Will cause state to update if the object changes)
  result,     // The result from the fetch          (State will not change, this is just the raw result from the fetch)
  error,      // If there was an error, undefined otherwise
  isFetching, // Is fetching, Happens on mount and when refetch() is called
  refetch,    // Refetch the data
} = query


const infiniteQuery = useInfiniteQuery({
  index: "homeFeed-home",
  getData: r => r.data,
  getNextPageParams: r => r.nextParams,
  fetch: nextParams => fakePaginatingFetch(posts, nextParams),
  enabled: true // Default is true
  // select: {} // Optionally you can pass select here or it will just select the object with no joins.
})


const {
  state,          // A piece of state that was selected (Will cause state to update if the object changes)
  error,          // If there was an error, undefined otherwise
  isLoading,      // Happens only on mount
  isFetching,     // When fetchNextPage() is called
  hasNextPage,    
  nextPageParams,
  fetchNextPage,  // Fetch the next page
  refresh         // Clear the index and reinitialize the hook. Basically reset.
} = infiniteQuery;


  /**
   * NOTE: fakeFetch() returns the object that was passed in
   * 
   * Imagine a post = {id: 10}
   * 
   * const result = fakeFetch({id: 10})
   * 
   * console.log(result) // Will print "{id: 10}"
   */

  /**
   * We used __identify__ here, if you read 
   * https://www.npmjs.com/package/@jjmyers/object-relationship-store
   * You'll understand why
   * Similarly, you can add the result from the mutation to an 
   * index by passing __indexes__
   * Or you can delete the object by passing __destroy__
   */
  const updatePost = useMutation({ mutate: () => fakeFetch({ id: 10, createdAt: "Updated", __identify__: "post" }) })

  const {
    mutate,   // A function to start the mutation
    error,    // If error, otherwise undefined
    isLoading // If the mutation is fetching
  } = updatePost


  /**
   * Below is an example of a few things you can do in a mutation
   * If you read https://www.npmjs.com/package/@jjmyers/object-relationship-store, it will make more sense if it's not clear.
   */
  const updatePost = useMutation({ mutate: () => fakeFetch({ id: 10, createdAt: "Updated", __identify__: "post" }) })

  const createPost = useMutation({ mutate: () => fakeFetch({ id: 10, __identify__: "post", __indexes__: ["homeFeed-home"] }) })

  const deletePost = useMutation({ mutate: () => fakeFetch({ id: 10, __identify__: "post", __destroy__: true }) })

```