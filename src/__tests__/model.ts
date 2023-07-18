import { createTable, createModel } from "../model"

export interface User {
	id: number;
	username: string;
}

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

export default model;