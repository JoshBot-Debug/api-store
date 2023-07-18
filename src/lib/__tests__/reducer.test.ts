import React from "react";
import model from "./model";
import { toModel } from "../reducer";


describe("reducer", () => {

    it("toModel with one user", () => {

        const user = {
            id: 1,
            username: "Jane",
            token: {
                user: 1,
                token: "<secret-token>"
            }
        }

        const _model = model as Model.Model<Model.Table.Proto>;

        const data = toModel({
            model: _model,
            currentCache: {},
            initialTable: "user",
            payload: user
        })

        expect(data).toMatchSnapshot(data)
    });


    it("toModel with more users", () => {

        const user = {
            id: 1,
            username: "Jane",
            token: {
                user: 1,
                token: "<secret-token>"
            }
        }

        const _model = model as Model.Model<Model.Table.Proto>;

        const data = toModel({
            model: _model,
            currentCache: {},
            initialTable: "user",
            payload: user
        })

        expect(data).toStrictEqual({
            "token": {
                "1": {
                    "token": "<secret-token>",
                    "user": 1,
                },
            },
            "user": {
                "1": {
                    "id": 1,
                    "token": 1,
                    "username": "Jane",
                },
            },
        })

        const users = [
            {
                id: 1,
                username: "Jane updated",
                token: {
                    user: 1,
                    token: "<secret-token-updated>"
                }
            },
            {
                id: 2,
                username: "Mike",
            }
        ]

        const next = toModel({
            model: _model,
            currentCache: data,
            initialTable: "user",
            payload: users
        })

        expect(next).toStrictEqual({
            "token": {
                "1": {
                    "token": "<secret-token-updated>",
                    "user": 1,
                },
            },
            "user": {
                "1": {
                    "id": 1,
                    "token": 1,
                    "username": "Jane updated",
                },
                "2": {
                    "id": 2,
                    "username": "Mike",
                },
            },
        })

        expect(next).toMatchSnapshot(next)
    });


    it("toModel should do an upsert", () => {

        const user = {
            id: 1,
            username: "Jane",
            token: {
                user: 1,
                token: "<secret-token>"
            }
        }

        const _model = model as Model.Model<Model.Table.Proto>;

        const data = toModel({
            model: _model,
            currentCache: {},
            initialTable: "user",
            payload: user
        })

        expect(data).toStrictEqual({
            "token": {
                "1": {
                    "token": "<secret-token>",
                    "user": 1,
                },
            },
            "user": {
                "1": {
                    "id": 1,
                    "token": 1,
                    "username": "Jane",
                },
            },
        })

        const users = [
            {
                id: 1,
                token: {
                    user: 1,
                }
            },
            {
                id: 2,
                username: "Mike",
            }
        ]

        const next = toModel({
            model: _model,
            currentCache: data,
            initialTable: "user",
            payload: users
        })

        expect(next).toStrictEqual({
            "token": {
                "1": {
                    "token": "<secret-token>",
                    "user": 1,
                },
            },
            "user": {
                "1": {
                    "id": 1,
                    "token": 1,
                    "username": "Jane",
                },
                "2": {
                    "id": 2,
                    "username": "Mike",
                },
            },
        })

        expect(next).toMatchSnapshot(next)
    });


    it("toModel benchmark", () => {

        const user = {
            id: 1,
            username: "Jane",
            token: {
                user: 1,
                token: "<secret-token>"
            },
            wishlist: {
                id: 99,
                products: new Array(15000).fill(0).map((_, i) => ({ id: i + 101, name: `Random Product ${i + 1}` }))
            }
        }

        const _model = model as Model.Model<Model.Table.Proto>;

        const startTime = performance.now();

        toModel({
            model: _model,
            currentCache: {},
            initialTable: "user",
            payload: user
        })

        const endTime = performance.now();

        const seconds = (endTime - startTime) / 1000

        expect(seconds).toBeLessThanOrEqual(0.5)
    });
});