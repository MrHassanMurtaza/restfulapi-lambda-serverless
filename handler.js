'use strict';

const AWS = require('aws-sdk');


const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10'});

const bookTable = process.env.TABLE_NAME

function response(statusCode, message) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(message)
  }
}

module.exports.createBook = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  const book = {
    user_id: reqBody.user_id,
    isbn: reqBody.isbn,
    createdAt: new Date().toISOString(),
    title: reqBody.title,
    author: reqBody.author,
    sellingprice: reqBody.sellingprice,
    active: reqBody.active
  }

  return db.put({
    TableName: bookTable,
    Item: book
  }).promise().then(() => {
    callback(null, response(201, book))
  }).catch( err => response(null, response(err.statusCode, err)) )

}

function sortByDate(a, b) {
  if (a.createdAt > b.createdAt){
    return -1
  } else return 1;
}

module.exports.getAllBooks = (event, context, callback) => {

  return db.scan({
    TableName: bookTable,
  }).promise().then(res => {
    callback(null, response(201, res.Items.sort(sortByDate)))
  }).catch( err => callback(null, response(err.statusCode, err)) )

}

module.exports.getBookByIdIsbn = (event, context, callback) => {
  const id = event.pathParameters.id;
  const isbn = event.pathParameters.isbn;

  const params = {
    TableName: bookTable,
    KeyConditionExpression:"#id = :idValue and #isbn = :isbnValue ",
    ExpressionAttributeNames: {
        "#id":"user_id",
        "#isbn":"isbn"
        },
    ExpressionAttributeValues: {
        ":idValue": id,
        ":isbnValue": isbn
        }
    };
  
  return db.query(params).promise().then((res) => {
    callback(null, response(201, res.Items))
  }).catch( err => callback(null, response(err.statusCode, err)) )

}

module.exports.updateBook = (event, context, callback) => {
  const id = event.pathParameters.id;
  const body = JSON.parse(event.body);
  const paramName = body.paramName;
  const paramValue = body.paramValue;


  const params = {
    Key: {
      user_id: id
    },
    TableName: bookTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'set ' + paramName + ' = :v', 
    ExpressionAttributeValues: {
      ':v' : paramValue
    },
    ReturnValue: 'ALL_NEW'
  };

  return db.update(params).promise().then( res => {
    callback(null, response(200, res))
  }).catch( err => callback(null, response(err.statusCode, err)) );

}

module.exports.deleteBook = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      user_id: id
    },
    TableName: bookTable
  }  

  return db.delete(params).promise().then(() => {
    callback(null, response(200, {message: 'Book deleted successfully'}))
  }).catch( err => callback(null, response(err.statusCode, err)) );

}

