//			*************************
// 			***** -- START UP -- ****
//			*************************

// add default collection of items
 Meteor.startup(function () {
    if (Books.find().count() === 0) {
    	// default collection of books
	  Books.insert({title: "Lady Chatterley's Lover", author: "D. H. Lawrence", subject: "fiction", loanedWith: null});
	  Books.insert({title: "The Gulag Archipelago", author: "Aleksandr Solzhenitsyn", subject: "fiction", loanedWith: null});
   	  Books.insert({title: "Fanny Hill or Memoirs of a woman of pleasure", author: "John Cleland", subject: "fiction", loanedWith: null});
      Books.insert({title: "The Decameron", author: "Giovanni Boccaccio", subject: "fiction", loanedWith: null});
      Books.insert({title: "Brave new world", author: "Aldous Huxley", subject: "fiction", loanedWith: null});
	  Books.insert({title: "The Anarchist cookbook", author: "William Powell", subject: "Anarchism", loanedWith: null});
      Books.insert({title: "Never love a Highlander", author: "Maya Banks", subject: "fiction", loanedWith: null});
      Books.insert({title: "Steal this book", author: "Abbie Hoffman", subject: "Anarchism", loanedWith: null});
      Books.insert({title: "Waking up with the duke", author: "Lorraine Heath", subject: "fiction", loanedWith: null});
      Books.insert({title: "Little Brother", author: "Cory Doctorow", subject: "fiction", loanedWith: null});
      Books.insert({title: "Farenheit 451", author: "Ray Bradbury", subject: "fiction", loanedWith: null});
      Books.insert({title: "On Revolution", author: "Hannah Arendt", subject: "Revolutionary movemements", loanedWith: null});
      Books.insert({title: "Two hundred pharaohs, five billion slaves", author: "Adrian Peacock", subject: "Communism", loanedWith: null});
      Books.insert({title: "Burn this book", author: "Toni Morrison (ed)", subject: "Censorship", loanedWith: null});
      Books.insert({title: "The Communist Manifesto", author: ["Karl Marx", "Friedrich Engels"], subject: "Communism", loanedWith: null});
      Books.insert({title: "Feed", author: "M. T. Anderson", subject: "fiction", loanedWith: null});
      Books.insert({title: "Zer0es", author: "Chuck Wendig", subject: "fiction", loanedWith: null});
      Books.insert({title: "Baby's first book of JavaScript", author: "Jane Smith", subject: "Books for children", loanedWith: null});
      Books.insert({title: "1984", author: "George Orwell", subject: "fiction", loanedWith: null});
      Books.insert({title: "Discover Meteor", author: ["Tom Coleman", "Sacha Greif"], subject: "Computer Programming", loanedWith: null});
      Books.insert({title: "Sense and sensibility", author: "Jane Austen", subject: "fiction", loanedWith: null});
      Books.insert({title: "Nowhere to hide", author: "Glenn Greenwald", subject: "National Security Agency (United States)", loanedWith: null});
      Books.insert({title: "Program or be programmed", author: "Douglas Rushkoff", subject: "Computer Programming", loanedWith: null});  	
    }
  });

// ensure users can access their Mylar info
 Meteor.startup(function () {
    Meteor.publish("users", function () {
        return Meteor.users.find(this.userId, {fields: {}});
    });
 })

// set up array for collecting data on what is borrowed together. We'll use this when issuing items. 
// It's up here to keep it available to all methods. I know this is frowned upon but YOLO.

var issuedToday = [];

//			*************************
// 			***** -- PUBLISH -- *****
//			*************************

Meteor.publish('Books', function(){
	return Books.find()
});

Meteor.publish('Borrowers', function(){
	return Borrowers.find()
});

// allow users to see the information in their own 'items'
Meteor.publish("userData", function () {
  if (this.userId) {
    return Meteor.users.find(
    	{_id: this.userId},
        {fields: {'items': 1, 'createdAt': 1}});
  } else {
    this.ready();
  }
});

// allow current user to access their tinfoilUsers record
Meteor.publish("tin-user", function(){
	return TinfoilUsers.find({user: this.userId})	
	// this won't return anything other than the logged-in user's docs anyway, but it's good practice to restrict to current user.
});

// allow current user to see their loans history
Meteor.publish("loanHistory", function(){
	return TinfoilLoansHistory.find({user: this.userId})
});

Meteor.publish("Users", function(){
	return Meteor.users.find({}, {fields: {_id: 1, username: 1}})
});

//			*************************
// 			***** -- METHODS -- *****
//			*************************

Meteor.methods({
	'tinfoilItemsIssued' : function(tinfoilItemId){					
		var currentUser = Meteor.userId();
		// Get the current date and time
		var issueDate = new Date();
		var due = new Date();
		// get rid of the time
		due.setHours(0,0,0,0);
		// make it a week in the future
		due.setDate(due.getDate() + 7);
		// upsert a borrower record (returns an _id)
		var borrower = Borrowers.upsert({BorrowerItemId: tinfoilItemId}, {$set: {IssueDate: issueDate, dueDate: due}});			
		// update the item record with the borrower id we just got, and the due date
		Books.update({_id: tinfoilItemId}, {$set: {onloanTo: borrower.insertedId, dueBack: due}});
		// upsert/increment a record for notifications
		var tU = TinfoilUsers.findOne({user: currentUser});

		// if there's already a record for this user...
		if (tU) {			
			var myDates = TinfoilUsers.findOne({user: currentUser}).dates;
			// check each date in the list	
			myDates.forEach(function(x){	
				var matching = (x.date.getTime() === due.getTime());				
				var exists = TinfoilUsers.findOne({user: currentUser, dates: {$elemMatch: {date: due}}});
				// if today's due date is already there, increment the total, remove the existing entry and replace it
				// with the incremented date
				if (matching) {
					newTotal = x.total + 1;
					TinfoilUsers.update({user: currentUser}, {$pull: {dates: {date: due}}},
						function(){TinfoilUsers.update({user: currentUser}, {$push: {dates: {date: due, total: newTotal}}})
					});
				}
				// if it doesn't exist, push an entry to the dates array
				if (!exists) {
					TinfoilUsers.update({user: currentUser}, {$push: {dates: {date: due, total: 1}}});
				}		
			});
			// if this is the first time the user has borrowed, insert a new entry to tinUsers
		} else {
			TinfoilUsers.insert({user: currentUser, dates: [{date: due, total: 1}]});
		}
		// push item ID to 'issuedToday' array.
		issuedToday.push(tinfoilItemId);
		 		// log to server console (just for testing)
		console.log('issued this session: ' + issuedToday)
	},
	// Return items	
	'tinfoilItemsReturn' : function(tinfoilReturnId){
		//Set the 'onloanTo' value to null in the Books collection
		Books.update(
			{_id: tinfoilReturnId}, 
			{$set: {onloanTo: null, dueBack: null}}
		);
		//Remove the entire matching document from 'Borrowers' collection
		Borrowers.remove({BorrowerItemId: tinfoilReturnId});
	},
	'addItem': function(title, author, subject){
		Books.insert({
			title: title,
			author: author,
			subject: subject
		});
	},
	// Update item records with info about items issued together
	'youMightAlsoLike' : function(){
		// Create a new array. We use this later to update the loanedWith array without interfering with issuedToday (above).
		var freshLoans = [];

		// add all the new items to loanedWith, but only if they're not already there.
		function clean(d){
			// pull out all the IDs in 'loanedWith' and create a variable with all duplicates removed.
			lw = Books.findOne(d).loanedWith;			
			var newArray = issuedToday.concat(lw);			
			// dedupe using underscore's _.uniq
			var deduped = _.uniq(newArray);
			
			// function to stop the item's own id from being added
			// also excludes null from the array
			function notSelf(id) {
				return (id !== d && id !== null && id !== "null");
			}

			// filter the array using notSelf
			var newLoanedWith = deduped.filter(notSelf);
			// update the item record with the new loanedWith entry
			Books.update({_id: d}, {$set: {loanedWith: newLoanedWith}});

		};

		function clearToday (e){
			// clear out loanedToday and freshLoans now that we've cycled through them.
			issuedToday.length = 0;
		};

		// THIS IS WHERE THE ACTION IS
		// call clean function for each item issued in this batch
		issuedToday.forEach(function(d){
			clean(d)
		});
		// clear out the issuedToday array
		clearToday();
	}
});
