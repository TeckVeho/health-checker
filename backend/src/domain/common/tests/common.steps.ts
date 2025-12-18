// src/features/common/tests/common.steps.ts

import { AfterAll, Before, BeforeAll, When, Then, Given } from '@cucumber/cucumber';
import request from 'supertest';
import { expect } from 'chai';
import express from 'express';
import routes from '../../../router';
import createSequelizeInstance from '../../../config/database';
import setupAssociations from '@config/associations';
import getMessage from '../../../utils/message';

setupAssociations();

const sequelize = createSequelizeInstance();
const app = express();
app.use(express.json());
app.use('/api', routes);

let response: request.Response;
let createdId: number | undefined;

BeforeAll(async function () {
  try {
    await sequelize.authenticate();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database connection error:', error);
    }
    throw new Error('Failed to connect to the database');
  }
});

Before(async function () {
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database synchronization error:', error);
    }
    throw new Error('Failed to synchronize the database');
  }
});

AfterAll(async function () {
  await sequelize.close();
});

// Given steps
Given('I have created a new entity at {string} with the following data:', async function (endpoint: string, dataTable) {
  const data = dataTable.hashes()[0];
  response = await request(app).post(endpoint).send(data);
  createdId = response.body.id;
  expect(createdId).to.exist;
});

// When steps
When('I send a POST request to {string} with the following data:', async function (endpoint: string, dataTable) {
  const data = dataTable.hashes()[0];
  response = await request(app).post(endpoint).send(data);
  createdId = response.body.id;
});

When('I send a GET request to {string}', async function (endpoint: string) {
  response = await request(app).get(endpoint);
});

When('I send a GET request to {string} with the ID of the created entity', async function (endpoint: string) {
  const actualEndpoint = endpoint.replace('{id}', createdId?.toString() || '');
  response = await request(app).get(actualEndpoint);
});

When('I send a PUT request to {string} with the following data:', async function (endpoint: string, dataTable) {
  const data = dataTable.hashes()[0];
  const actualEndpoint = endpoint.replace('{id}', createdId?.toString() || '');
  response = await request(app).put(actualEndpoint).send(data);
});

When("I send a DELETE request to {string} with the created entity's ID", async function (endpoint: string) {
  const actualEndpoint = endpoint.replace('{id}', createdId?.toString() || '');
  response = await request(app).delete(actualEndpoint);
});

When('I send a DELETE request to {string}', async function (endpoint: string) {
  response = await request(app).delete(endpoint);
});

// Then steps
Then('the response status code should be {int}', function (statusCode: number) {
  if (response.status === 500) {
    console.log('500 error response dump:');
    console.dir(response.error, { depth: null }); // This will print the entire response object
  }
  expect(response.status).to.equal(statusCode);
});

Then('the response should contain the property {string}', function (property: string) {
  expect(response.body).to.have.property(property);
});

Then('the response should contain the property {string} with value {string}', function (property: string, value: string) {
  expect(response.body[property]).to.equal(value);
});

Then('the response should contain the message {string} with {string}', function (messagePath: string, arg: string) {
  const expectedMessage = getMessage(messagePath, arg);
  expect(response.body.message).to.equal(expectedMessage);
});

Then('the response should contain the error message {string} with {string}', function (errorPath: string, arg: string) {
  const expectedErrorMessage = getMessage(errorPath, arg);
  const actualErrors = Array.isArray(response.body.errors) ? response.body.errors : [response.body.error];
  expect(actualErrors).to.include(expectedErrorMessage);
});

Then("the response should contain the property {string} with the created entity's ID", function (property: string) {
  expect(response.body[property]).to.equal(createdId);
});

Then('the response should contain at least {int} items', function (count: number) {
  expect(response.body.length).to.be.greaterThanOrEqual(count);
});

Then('the response should contain the property {string} with value [{string}]', function (property: string, values: string) {
  if (!response || !response.body) throw new Error('Response or response body is undefined.');
  const expectedValues = values.split(',').map((v) => v.trim());
  let actualValues = response.body[property];
  if (!Array.isArray(actualValues)) {
    actualValues = [actualValues];
  }
  actualValues = actualValues.map((item: { name: string } | string) => (typeof item === 'object' && item.name ? item.name : item));
  expect(actualValues).to.deep.equal(expectedValues);
});

Then('the response should contain the nested {string} object with the updated details:', function (nestedProperty: string, dataTable) {
  if (!response || !response.body) throw new Error('Response or response body is undefined.');
  const expectedData = dataTable.hashes()[0];
  const entity = response.body[nestedProperty];
  expect(entity).to.have.property('id', createdId);
  for (const key in expectedData) {
    expect(entity).to.have.property(key);
    let expectedValue = expectedData[key];
    try {
      expectedValue = JSON.parse(expectedValue);
    } catch (error) {
      // Leave value as a string if it can't be parsed as JSON
      error;
    }
    expect(entity[key]).to.deep.equal(expectedValue);
  }
});

Then('the response should contain the property {string} with value [{string}, {string}]', function (property: string, value1: string, value2: string) {
  console.log(response.body);
  console.log('property ' + property);

  const expectedValues = [value1, value2];
  const actualValues = response.body[property];
  if (!actualValues || !Array.isArray(actualValues)) {
    throw new Error(`Expected ${property} to be an array, but got ${typeof actualValues}`);
  }
  const actualNames = actualValues.map((item: { name: string }) => item.name);
  expect(actualNames).to.deep.equal(expectedValues);
});
