// Subscriptions

// allows us to render information about the library's collection
Meteor.subscribe('Books');
// allows us to render item circulation information
Meteor.subscribe('Borrowers');
// allows us to render selected info about the current user
Meteor.subscribe("userData");
// allows us to see the current user's tinfoilUsers record
Meteor.subscribe("tin-user");
// allows us to render loans history for current user
Meteor.subscribe("loanHistory");
// get users
Meteor.subscribe("Users");
// get Mylar info
Tracker.autorun(function () {
    Meteor.subscribe("users");
});

// Accounts
Accounts.ui.config({
	passwordSignupFields: 'USERNAME_AND_EMAIL'
});

//			*************************
// 			***** -- EVENTS -- *****
//			*************************

// -------- Navigation events ---------

// On startup select 'Find and Return Item' screen

Meteor.startup(function(){
	Session.setDefault("selectedScreen", "active1");
	});

// When each button is pressed, make the relevant selected screen active
Template.mainNavigation.events({
	'click .navButton1' : function(){
		Session.set("selectedScreen", "active1");
	},
	'click .navButton2' : function(){
		Session.set("selectedScreen", "active2");
	},
	'click .navButton3' : function(){
	// This is the member info screen. We have to update the 'TinfoilUser' borrowers list when the user is logged in but before they see this
	// screen - we can't do it on the server because we need to use their Mylar keys to update the list. That means we can't do it when the 
	// item is returned, so we update it just before they look at the list.	
		var currentUser = Meteor.userId();			 			
		// check list of all borrowers
		// compare against list of user's borrowers
		// then save over the user's borrower list with only the ones in the universal borrowers list
		// this is really inefficient at large scale but works for demo purposes
		myBorrowers = [];
		myDates = [];
		var books = Books.find();
		var myUser = TinfoilUsers.findOne({user: currentUser});
		if (myUser) {
			var myBors = myUser.borrowers;
			if (myBors) {
				books.forEach(function(book){
					if (book.onloanTo) {
						var bor = book.onloanTo;
						myBors.forEach(function(borrower){
							if (borrower === bor) {
								//push to myBorrowers
								myBorrowers.push(borrower);

								// check if an entry with this duedate already exists in the myDates array
								var index = myDates.findIndex(function(x){									
									return x.date.getTime() === book.dueBack.getTime();									
								});															
								if (index === -1) {
									// if it doesn't, make the total = 1
									var newTotal = 1;
									myDates.push({date: book.dueBack, total: newTotal});
								} else {
									// if it does, increment the total
									var total = myDates[index].total;
									var newTotal = total + 1;
									// remove old entry and add replacement
									myDates.splice(index, 1, {date: book.dueBack, total: newTotal});
								}										
							}
						});
					}
				});			
				// delete existing TinfoilUsers entry and insert a new one as the callback
				var tUser = TinfoilUsers.findOne({user: currentUser})._id;
				TinfoilUsers.remove(tUser, function(error, result){
					if (error) {
						console.log(error);
					};
					var userPrinc = Meteor.user().username;
					var uName = Principal.user().name;
					var uId = Principal.user().id;
					// Insert replacement user (we have to do this because we can't "update" using Mylar)
					Principal.lookup([new PrincAttr("usr", userPrinc)], uName, function (principal) {
																							// THIS CURRENTLY ONLY WORKS BECAUSE WE'RE USING 'INSECURE'						
						TinfoilUsers.insert({usrPrinc: uId, user: currentUser, borrowers: myBorrowers, dates: myDates});


					});
				});	
			}
		};		
		Session.set("selectedScreen", "active3");
	},
	'click .navButton4' : function(){
		Session.set("selectedScreen", "active4");
	},
	'click .navButton5' : function(){
		Session.set("selectedScreen", "active5");
	},
	'click .navButton6' : function(){
		Session.set("selectedScreen", "active6");
	},
	'click .navButton7' : function(){
		Session.set("selectedScreen", "active7");
	},	
});

// -------- Collection events ---------

// For issuing items
// Store the item ID as a variable and 
// call the 'tinfoilItemsIssued' method from the server
// using this variable as an argument
Template.loanItems.events({
		'submit form': function(event){
		event.preventDefault();
		var tinfoilItemId = event.target.issueItem.value;
		var isOnloan = Books.findOne({_id: tinfoilItemId}).onloanTo;
		if (isOnloan) {
			alert("Item is on loan. You need to return it before you can issue it again!")
		} else {			
			var currentUser = Meteor.userId();
			// create Mylar principal for current user			
			var currentPrincipal = Principal.user(); 							// <-- undefined when logging in (rather than signing up)
			// create Principal name		
			var userPrinc = Meteor.user().username;
			Principal.create("usr", userPrinc, currentPrincipal, function(princ) {
			});
			// Get user principal
			var uName = Principal.user().name;
			var uId = Principal.user().id;
			Principal.lookup([new PrincAttr("usr", userPrinc)], uName, function (principal) {
				// Now update the item record on the server
				// Use  callback to do the rest so that we have the Borrowers entry before we try to do anything with it
				Meteor.call('tinfoilItemsIssued', tinfoilItemId, function(error, result){
					if (error) {
						console.log(error)
					}
					// get the borrower ID we just created
					var tb = Borrowers.findOne({BorrowerItemId: tinfoilItemId})._id;					
					// store an encrypted array of all the borrowers (and addresses) associated with this user
					var currentUser = Meteor.userId();
					var tUser = TinfoilUsers.findOne({user: currentUser});													
					var dates = tUser.dates;				
								 
					if (tUser.borrowers) {
						// get user's existing borrowers list
						var myBors = tUser.borrowers;
						// clone myBors
						var myBorrowers = myBors;
						// make a new array				
						myBorrowers.push(tb);
						// clone the new array			
						var newBorrowers = myBorrowers;			
						// remove the old record (we have to do this because we can't update inside Mylar)								
					} else {
						// if there isn't an existing borrowers array, make one.
						var newBorrowers = [tb];
					}
					// remove existing record (because we can't update from client)	
					TinfoilUsers.remove(tUser._id);
					// insert new record
					TinfoilUsers.insert({usrPrinc: uId, user: currentUser, borrowers: newBorrowers, dates: dates}); 
					TinfoilLoansHistory.findOne({user: currentUser});
					var lh = TinfoilLoansHistory.findOne({user: currentUser});					
					if (lh) {
						// if there are existing loans in the history, push the current item to the array
						var loans = TinfoilLoansHistory.findOne({user: currentUser}).loans;
						// if the item isn't already in the array, add it (we don't actually want every single loan just every item)
						var listed = loans.includes(tinfoilItemId);
						if (!listed) {
							loans.push(tinfoilItemId);
						}					
						// remove the existing record
						TinfoilLoansHistory.remove(lh._id);							
					} else {
						// if there are no existing loans, create a new array
						var loans = [tinfoilItemId]; 									
					}
					// insert a new record in loans history
					TinfoilLoansHistory.insert({usrPrinc: uId, user: currentUser, loans: loans});			
				});	
			});							
		}
		// clear the input field
		event.target.issueItem.value = "";
	}
});

// For returning itemSubject
Template.returnItems.events({
		'submit form': function(event){
		event.preventDefault();
		var currentUser = Meteor.userId();
		var tinfoilReturnId = event.target.returnItem.value;		
		event.target.returnItem.value = "";
		Meteor.call('tinfoilItemsReturn', tinfoilReturnId);
	}
});

// Add items as new documents 
// in the Mongo collection called 'libraryCollection'
// using the values from the addItemForm form
// We previously created a variable called 'Books'
// at tinfoil.js so we can refer to this collection

Template.addItemForm.events({
	'submit form': function(event){
	event.preventDefault();
	var libraryItemTitle = event.target.itemTitle.value;
	var libraryItemAuthor = event.target.itemAuthor.value;
	var libraryItemSubject = event.target.itemSubject.value;
	event.target.itemTitle.value = "";
	event.target.itemAuthor.value = "";
	event.target.itemSubject.value = "";
	Meteor.call('addItem', libraryItemTitle, libraryItemAuthor, libraryItemSubject);
	}
});

// send all the items borrowed today through to be added to 'borrowedWith'

Template.memberView.events({
	'click .send-loans' : function (){		
		Meteor.call('youMightAlsoLike');		
	}
});

//			*************************
// 			***** -- HELPERS -- *****
//			*************************

// SCREEN NAVIGATION
// Show the active screen when each button is selected
// and keep the selected button highlighted	
// These helpers return a class of 'true'			

Template.headerInfo.helpers({

});

Template.mainNavigation.helpers({
	activeScreen1 : function(f1){
		var showScreen = Session.equals("selectedScreen", "active1");
		return showScreen;
	},
	activeScreen2 : function(f2){
		var showScreen = Session.equals("selectedScreen", "active2");
		return showScreen;
	},
	activeScreen3 : function(f3){
		var showScreen = Session.equals("selectedScreen", "active3");
		return showScreen;
	},
	activeScreen4 : function(f4){
		var showScreen = Session.equals("selectedScreen", "active4");
		return showScreen;
	},
	activeScreen5 : function(f5){
		var showScreen = Session.equals("selectedScreen", "active5");
		return showScreen;
	},
	activeScreen6 : function(f6){
		var showScreen = Session.equals("selectedScreen", "active6");
		return showScreen;
	},
	activeScreen7 : function(f7){
		var showScreen = Session.equals("selectedScreen", "active7");
		return showScreen;
	},	
});

// Show all of the items in the collection 
// and sort by reverse-chronological issue date

Template.browseItems.helpers({
	'showItems' : function	(){
		return Books.find({}, {sort: {issuedISO: -1}});		
	},
	'multiAuthor': function(x){
		var type = typeof x.author;
		return type === "object";
	}
});

// Show all of the items ever borrowed by this user 

Template.memberView.helpers({
	'showMyItems' : function (){
		var currentUser = Meteor.userId();
		return Meteor.users.find({_id: currentUser});		
	},
	showTotalItems: function(){
		var userId = Meteor.userId();
		var user = TinfoilUsers.findOne({user: userId});
		if (user) {
			var userBorrowers = TinfoilUsers.findOne({user: userId}).borrowers; // this gives an error in browser console for some reason			
			var itemsOut = userBorrowers.length;
			return itemsOut
		};
	},
	myDueDates: function(){
		var userId = Meteor.userId();
		var user = TinfoilUsers.findOne({user: userId});
		if (user) {
			return user.dates;	
		}
	},
	stringify: function(x) {
		return x.toDateString();
	}	
});
// Find items currently out to this user
Template.onloanItems.helpers({

	'my' : function (){	
		var currentUser = Meteor.userId();				
		var tinU = TinfoilUsers.findOne({user: currentUser});
		if (tinU) {
			return tinU;
		};
	},
 	'getItemTitle': function(x){
		var itm = Borrowers.findOne({_id:x});		
		if (itm) {
			return Books.findOne(itm.BorrowerItemId).title;
		}
	},
 	'getItemAuthor': function(x){
		var itm = Borrowers.findOne({_id:x});		
		if (itm) {
			return Books.findOne(itm.BorrowerItemId).author;
		}
	},
 	'getItemDue': function(x){
		var itm = Borrowers.findOne({_id:x});		
		if (itm) {
			var date = Books.findOne(itm.BorrowerItemId).dueBack;
			if (date) {
				return date.toDateString();
			}
		}
	}						
});

Template.myitemsdetails.helpers({
	'getOldItems': function(){
		// TinfoilLoansHistory
		var currentUser = Meteor.userId();	
		return TinfoilLoansHistory.findOne({user: currentUser});
	},
	'getItemInfo': function(x){		
		return Books.findOne(x);
	}	
});



Template.youMightAlsoLike.helpers({	
	'showItems' : function	(){
		return Books.find({}, {sort: {issuedISO: -1}});		
	},
	'getBestMatch' : function(x) {
		// create empty object
		var tally = {};
		// get the item		
		var book = Books.findOne(x);
		// get loanWith list
		var lw = book.loanedWith;
		if (lw) {
			// for each item in the loanedWith listing, add it to the tally, or iterate its value by one if it already exists
			lw.forEach(function(x){
				tally[x] = (tally[x] || 0) + 1;
			});
			// get the highest value in the tally object (using Underscore, which comes with Meteor)
			var topLoans = _.max(tally);
			// invert the object so we can find the key by the value (i.e. which item has the highest value)
			var inverted = _.invert(tally);
			// get the id of the item, which is now the value rather than the key
			var mostPopular = inverted[topLoans];
			// get the actual items		
			var popBook = Books.findOne(mostPopular);		
			// return the title
			if (popBook) {
				return popBook.title;
			}			
		}
	},	
	'getLoanedWithTitles' : function(x) {
		var book = Books.findOne(x);
		if (book) {
			return book.title;
		}
	}
});
