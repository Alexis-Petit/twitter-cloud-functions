const admin = require("firebase-admin");
const functions = require("firebase-functions");

const app = require("express")();

const firebase = require("firebase");
const serviceAccount = require("/home/manjaro/Downloads/twitter-db013-firebase-adminsdk-q4thi-94bf5e88ac.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://twitter-db013.firebaseio.com"
});
firebase.initializeApp({
  apiKey: "AIzaSyBWsTbVlLrvWmsM7WQCCb3OeJ9QSW4U7V0",
  authDomain: "twitter-db013.firebaseapp.com",
  databaseURL: "https://twitter-db013.firebaseio.com",
  projectId: "twitter-db013",
  storageBucket: "twitter-db013.appspot.com",
  messagingSenderId: "1057069561280",
  appId: "1:1057069561280:web:cd8d4856a721b47a5b0425"
});

const db = admin.firestore();

app.get("/tweets", (req, res) => {
  db.collection("tweets")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let tweets = [];
      data.forEach(doc => {
        tweets.push({
          screamId: doc.id,
          userHandle: doc.data().userHandle,
          body: doc.data().body,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(tweets);
    })
    .catch(err => console.error(err));
});

app.post("/tweet", (req, res) => {
  const newTweet = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };
  db.collection("tweets")
    .add(newTweet)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      res.status(500).json({ error: `something went wrond` });
      console.error(err);
    });
});

const isEmpty = value => value.trim() === "";

app.post("/signup", (req, res) => {
  let token, userId;
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ handle: "this handle is already already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => res.status(201).json({ token }))
    .catch(err => {
      if (err.code === "auth/email-already-in-use")
        return res.status(400).json({ email: "Email already in use" });
      else return res.status(501).json({ error: err.code });
    });
});

exports.api = functions.region("europe-west1").https.onRequest(app);
