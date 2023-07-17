import React from "react";
import model from "./model";

describe("model", () => {

    it("creating a model", () => {
      expect(model).toMatchSnapshot(model)
    });

});