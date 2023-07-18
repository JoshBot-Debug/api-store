# Todo

- ***Possible feature?*** May want to replace context with an external store

# API store

## Step 1.

### **Define your objects and their relationship**

```ts
const user = createTable("user", {
	id: "number",
	username: "string"
})

const token = createTable("token", {
	user: "number",
	token: "string",
}, { pk: "user" })

const product = createTable("product", {
	id: "number",
	name: "string"
})

const wishlist = createTable("wishlist", {
	id: "number",
})


user.hasOne(token, "token")
user.hasOne(wishlist, "wishlist")
wishlist.hasMany(product, "products")

const model = createModel([
	user,
	token,
	product,
	wishlist
])

```

## Step 2.

### **Wrap you application in the APIStore provider**

```tsx
<APIStore model={model} ></APIStore>
```

## Step 4.

### **You're done!**
### **Use the following to get and set data.**

```ts

const { result, isFetching, error, refetch } = useQuery({ table: "user", get: { fetch: getUsers } });

const { mutate, isLoading, error } = useMutation({table: "user", mutate: updateUser});

```