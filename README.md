# API store

***WARNING: experimental.***

## Step 1.

### **Define your objects and their relationship**

```ts
const user = createRelationalObject("user", {
	id: "number",
	username: "string"
})

const product = createRelationalObject("product", {
	id: "number",
	name: "string"
})

const wishlist = createRelationalObject("wishlist", {
	id: "number",
})


user.hasOne(wishlist, "wishlist")
wishlist.hasMany(product, "products")


const store = createStore({
  relationalCreators: [
    user,
    product,
    wishlist
  ],

  // Used to identify an object that is upserted in the store.
  // Optionally, the object can contain a __identify__: "wishlist" field to identify what object it is
  // using the __identify__ will be faster.
  identifier: {
    user: o => "username" in o,
    product: o => "productName" in o,
    wishlist: o => "wishlistName" in o,
  }
});


```

## Step 2.

### **Wrap you application in RelationalStoreProvider**

```tsx
<RelationalStoreProvider model={model} ></RelationalStoreProvider>
```

## Step 4.

### **You're done!**
### **Use the following to get and set data.**

```ts

type From = "user" | "wishlist" | "product"

// Example useage
const query = useQuery<From, User, User>({
  
  // Optionally add a fetch to get data on mount
  fetch: () => GetData.request({user: 10}),

  // Select some data from the store
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


```