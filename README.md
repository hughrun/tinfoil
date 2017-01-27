# Tinfoil README

## Intro

This is a demo system for a client-side encrypted lending library circulation system. it allows you to have users borrow items from a library without the system being able to track who has borrowed what item, whilst still being able to track relationships between items and offer borrowing suggestions.

It’s written in JavaScript using Meteor and Mylar, and is inspired by [Zoia Horn](https://en.wikipedia.org/wiki/Zoia_Horn).

See [https://www.hughrundle.net/tinfoil](https://www.hughrundle.net/tinfoil) for more information and background.

## Dependencies

* Meteor 1.1.3
* meteor-platform
* accounts-password
* matteodem:easy-search
* accounts-ui
* mylar:platform

## Usage

Mylar was a grad school project and does not appear to be actively maintained. Tinfoil works in Meteor v1.1.3 but has some issues in later versions - probably because of incompatibilities in Mylar's older code base - I'm not 100% sure.

To run Tinfoil, make sure you use the `--release` flag when creating your Meteor project: `meteor create myapp --release 1.1.3`. This will ensure you're using Meteor v1.1.3. **Note this version of Meteor is deprecated - use at your own risk**.

Any images, font files etc you want to use should be placed in a `public` directory and referenced directly (e.g. if you have an image file at public/foo/bar.jpg it should be referenced in your codes as 'foo/bar.jpg').

## Install locally

* [Install Meteor](https://www.meteor.com/install)
* create your app directory:

`meteor create myapp --release 1.1.3`
`cd myapp`
* add packages:
`meteor add meteor-platform`
`meteor add accounts-password`
`meteor add mateodem:easy-search`
`meteor add accounts-ui`
`meteor add mylar:platform`

* Run:
`meteor` 

## Licence

MIT - Hugh Rundle 2016