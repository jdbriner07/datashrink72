var Analysis = require('../../database/models/analyses');
var TraitScore = require('../../database/models/analyses_traits');
var tw = require('../social/twitter.js');
var personalityHelper = require('./personality-insights');

var analysisId;

var analyzeProfile = function(req, res) {
  var analyze = function(text) {
    var params = {
      content_items: [{ content: text }],
      // consumption_preferences: true,
      raw_scores: true,
      headers: {
        'accept-language': 'en',
        'accept': 'application/json'
      }
    };
    personalityHelper.profileFromText(params)
      .then(function(profile) {
        var parseParams = {
          name: req.body.name,
          context: req.body.context,
          private: req.body.private,
          userId: req.cookies.session
        }
        parseProfile(parseParams, profile)
          .then(function(analysisId) {
            res.redirect(301, '/analyses/' + analysisId);
          }); 
      })
      .catch(function(error) {
        console.log(error.error);
        // res.status(400);
        res.render('error', error.error);
        // res.redirect(400, '/create');
      });
  }

  if (req.body.context === 'twitter') {
    Analysis.findOne({ person: req.body.name }, function(err, analysis) {
      if (analysis) {
        res.redirect(301, '/analyses/' + analysis.id);
      } else {
        tw.analyzeProfile(req.body.name.slice(1))
          .then(function(tweets) {
            analyze(tweets);
          });
      }
    })
  } else if (req.body.context === 'text') {
    analyze(JSON.stringify(req.body.text));
  } else {
    res.redirect(500, '/');
  }
}

var parseProfile = function(params, profile) {
  return new Promise(function(resolve, reject) {
    var analysis = {
      person: params.name,
      context: params.context,
      word_count: profile.word_count,
      private: params.private,
      user_id: params.userId
    };

    var newAnalysis = new Analysis(analysis);
    newAnalysis.save(function(err, result) {
      if (err) reject(err);
      else {
        analysisId = result.id;
        Promise.all([parseTraits(profile.personality), 
          parseTraits(profile.needs), 
          parseTraits(profile.values)])
        .then(function() {
          resolve(analysisId);
        })
      }
    });
  });
}

var parseTraits = function(category) {
  return new Promise(function(resolve, reject) {
    category.forEach((trait) => {
      var traitObj = {
        analysis_id: analysisId,
        trait_id: trait.trait_id,
        name: trait.name,
        category: trait.category,
        percentile: trait.percentile,
        raw_score: trait.raw_score
      };
      if (trait.children !== undefined) {
        parseTraits(trait.children).then(function() {
          delete trait.children;
        });
      }
      var newTrait = new TraitScore(traitObj);
      newTrait.save(function(err, result) {
        if (err) reject(err);
      });
    });
    resolve();
  });
}

module.exports.analyzeProfile = analyzeProfile;