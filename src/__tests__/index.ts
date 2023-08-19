import { createRelationalObject, createRelationalObjectIndex, createStore } from "@jjmyers/object-relationship-store";

// By default ```js createRelationalObject() ``` looks for
// the prop "id" to use as a primary key.
// Optionally, if "id" is not the primary key of the object, you can specify what to use as a primary key like this
/// ```js const user = createRelationalObject("user", {pk: "number"}, { primaryKey: "pk" });```

// Here we have defined 4 objects, all have id, it will be used as the primary key for the object.
// Note: Right now, it does not matter if you specify the value as "number", "string" or anything else. (In the future this may be used.)
const user = createRelationalObject("user");
const image = createRelationalObject("image");
const thumbnail = createRelationalObject("thumbnail");
const post = createRelationalObject("post");

// Here we specify the relationship between the objects.
// Image has many thumbnail objects as "thumbnails"
// const image = {id: 10, thumbnails: [ {id: 1, ...otherFields}, {id: 2, ...otherFields} ] }
image.hasMany(thumbnail, "thumbnails")

// User has one image object as "profileImage"
// const user = {id: 5, profileImage: {id: 101, aspectRatio: 1.22, ...otherFields} }
user.hasOne(image, "profileImage")
post.hasMany(image, "images")
post.hasOne(user)
user.hasMany(post, "posts")
image.hasOne(user)
image.hasOne(post)

// Here we create some object indexes.
// When and why do we use this?
// Imagine you have a page that lists out Posts,
// You want to keep track of the order in which the Posts are retreived.
// You refresh the page, you get 10 posts, when you scroll down, 10 more are added, the order must be maintained
// so we create an index. This way we can select posts in the order which we received them from the API endpoint.
const homeFeed = createRelationalObjectIndex("homeFeed", [post])
const users = createRelationalObjectIndex("users", [user])


const store = createStore({

  relationalCreators: [user, post, image, thumbnail],

  indexes: [homeFeed, users],

  // The identifier is used to identify what type of object we are trying to upsert into the store
  identifier: {
    'user': o => "username" in o,     // If the object contains "username", it is a "user" object.
    'image': o => "aspectRatio" in o, // If the object contains "aspectRatio", it is an "image" object.
    'thumbnail': o => "uri" in o,     // If the object contains "uri", it is a "thumbnail" object.
    'post': o => "caption" in o,      // If the object contains "caption", it is a "post" object.
  }
});


console.log(store)