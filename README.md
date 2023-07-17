# Todo

- ***Possible feature?*** May want to replace context with an external store

    // API store
    // 
    // Step 1.
    // Define your objects and their relationship
    // const user = createTable({ ...fields })
    //
    // Step 2.
    // Create a model
    // const model = createModel([user])
    //
    // Step 3.
    // Wrap you application in the APIStore provider
    // <APIStore model={model} ></APIStore>
    //
    // Step 4.
    // You're done!
    // Use the following to get and set data.
    // const { result, isLoading } = APIStore.useQuery({ table: "user", get: { fetch: getUsers } })
    // const { set, upsert } = APIStore.useMutation()