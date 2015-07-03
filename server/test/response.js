var Reaction = require('../models/reactions.js').Reaction;
var Definition = require('../models/definition.js').Definition;
var Votes = require('../models/votes.js').Votes;
var Response = require('../models/response.js').Response;
var Searches = require('../models/searches.js').Searches;
var dataManager = require('../models/data-manager.js').dataManager;

var helper = require('./helper-representations.js');
var should = require('should');
var status = require('http-status');

var config = require('../config').config;


describe('Response', function() {
  var definition;

  describe('Response (Model)', function() {
    var response;
    beforeEach(function(done) {
      response = helper.mockResponse();
      done();
    });

    it('should verify the structure of an instance', function() {
      response.should.be.an.instanceOf(Object);
      response.should.have.property("meta");
      response.should.have.property("data");
    });

    it('should verfify an execution time was calculated', function() {
      response.meta.should.have.property('execution_time');
    });

  });

});
