// Collection for library items
// Initial items are created in server.js on startup
Books = new Meteor.Collection('books');

// add searchable index using EasySearch
Books.initEasySearch(['title', 'author', 'subject'], {
	'limit' : 1,
	'use' : 'mongo-db',
	'props' : {
		'anyfield' : true
	}
});

// Collection for user surrogates when borrowing items
Borrowers = new Meteor.Collection('borrowers');

// We keep a list of the borrowers and addresses associated with each user here
TinfoilUsers = new Meteor.Collection('tinUsers');
// Mylar code to encrypt 'borrowers' field in tinUsers
Meteor.Collection.intercept.init(TinfoilUsers);
TinfoilUsers._encrypted_fields({
			'borrowers': {
					princ: 'usrPrinc',
					princtype: 'usr',
					auth: ['_id']
				}
			});

// we keep a list of the items borrowed here
TinfoilLoansHistory = new Meteor.Collection('loanHistory');
// Mylar code to encrypt it
Meteor.Collection.intercept.init(TinfoilLoansHistory);
TinfoilLoansHistory._encrypted_fields({
			'loans': {
					princ: 'usrPrinc',
					princtype: 'usr',
					auth: ['_id']
				}
			});

//			****************************
// 			***** -- ALLOW/DENY -- *****
//			****************************

// This allows us to write to the database from the browser (but only if the logged in user is the user listed in the relevant document)

TinfoilUsers.allow({
	insert: function(userId, doc) {
		return (userId === doc.user)
	},
	remove: function(userId, doc) {
		return (userId === doc.user)
	}
});

TinfoilLoansHistory.allow({
	insert: function(userId, doc) {
		return (userId === doc.user)
	},
	remove: function(userId, doc) {
		return (userId === doc.user)
	}
});