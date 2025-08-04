const express = require("express");
const AppError = require("./src/utils/appError");
const crypto = require("crypto");
const fetch = require("node-fetch");
const faqRoutes = require("./src/routes/faqRoutes");

const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const errorHandler = require("./src/middlewares/errorHandler");
const tourRoutes = require("./src/routes/tourRoutes");
const reviewRoutes = require("./src/routes/reviewRoutes");
const vendorRoutes = require("./src/routes/vendorRoutes");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const authRoutes = require("./src/routes/authRoutes");
const destinationRoutes = require("./src/routes/destinationRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const blogRoutes = require("./src/routes/blogRoutes");
const contactRoutes = require("./src/routes/contactRoutes");
const aboutusRoutes = require("./src/routes/aboutUsRoutes");
const usersRoutes = require("./src/routes/userRoutes");
const tourguidesRoutes = require("./src/routes/tourGuideRoutes");
const questionsRoutes = require("./src/routes/questionRoutes");
const settingRoutes = require("./src/routes/appSettingsRoutes");
const Booking = require("./src/model/BookingModel");
const homeScreenRoutes = require("./src/routes/homeScreenRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const availablityRoutes = require("./src/routes/availabilityRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const adminNotification = require("./src/routes/notificationAdminRoutes");
const paymentRoutes = require('./V2/routes/paymentRoutes');
const destinationRoutesv2 = require('./V2/routes/paymentRoutes');
const v2Routes = require('./V2/routes/index');
const { scheduleAllEvents } = require("./src/cronScheduler");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const responsea = require("./src/utils/response");
// const permissionRoutes = require('./src/routes/permissionRoutes');
const admin = require("./firebase/firebaseAdmin");
// const admin = require('./firebaseadmin/admin2');

const Notification = require("./src/model/NotificationModel"); // Assuming this is the path to the Notification model
const User = require("./src/model/UserModel");

const port = process.env.PORT || 9000;
const path = require("path");

require("./src/app");
// Middleware to parse JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
// app.use(cors());
// MongoDB connection
// mongoose.connect(process.env.DB, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });

// mongo mongodb://<username>:<password>@45.93.136.163:27017/admin

mongoose.connect("mongodb+srv://adalaapp:123456789ma@cluster0.a93vbj1.mongodb.net/keytour", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
  scheduleAllEvents();
});
// app.use('/api/access-control', permissionRoutes);
app.post("/api/send-notification", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token and message are required" });
  }

  const message = {
    notification: {
      title: "metawea",
      body: "metawea",
    },
    token: token,
  };

  try {
    // Send the notification to the provided FCM token
    const response = await admin.messaging().send(message);

    console.log("Successfully sent message:", response);
    return res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ success: false, error });
  }
});

// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// app.post('/api/verify-auth', async (req, res) => {
//   const { idToken } = req.body;

//   try {
//     // Verify the ID token
//     const ticket = await client.verifyIdToken({
//       idToken: idToken,
//       audience: process.env.GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
//     });

//     const payload = ticket.getPayload();
//     const userid = payload['sub'];

//     // Optionally, you can now generate a session or JWT for your own backend
//     const token = jwt.sign({ userid: userid }, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.status(200).json({ success: true, token: token, user: payload });
//   } catch (error) {
//     console.error('Error verifying token:', error);
//     res.status(401).json({ success: false, message: 'Invalid token' });
//   }

// });

const client = new OAuth2Client("117121264292-27qhp0o12ut2rvd00tj4h5vrn1npr05i.apps.googleusercontent.com");

async function getGooglePublicKeys() {
  const res = await fetch("https://www.googleapis.com/oauth2/v1/certs");
  return res.json();
}

app.post("/api/verify-auth", async (req, res) => {
  const { idToken } = req.body;

  try {
    admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        const uid = decodedToken.uid;
        // يمكنك الآن استخدام UID الخاص بالمستخدم أو البيانات التي حصلت عليها من decodedToken
        console.log("تم تسجيل المستخدم بنجاح:", decodedToken);
        res.json({
          success: true,
          message: "User successfully authenticated",
          userId: uid,
          userDetails: decodedToken,
        });
      });

    // const publicKeys = await getGooglePublicKeys();
    // const ticket = await client.verifyIdToken({
    //   idToken: idToken,
    //   audience: '117121264292-27qhp0o12ut2rvd00tj4h5vrn1npr05i.apps.googleusercontent.com',
    //   certs: publicKeys,  // You can manually specify the certs here
    // });

    // const payload = ticket.getPayload();
    // const userid = payload['sub'];

    // const token = jwt.sign({ userid: userid }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // res.status(200).json({ success: true, token: token, user: payload });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
});

const merchantId = "TESTEGPTEST"; // Provided Merchant ID
const password = "c622b7e9e550292df400be7d3e846476"; // Provided Password
const secretKey = "<YOUR_SECRET_KEY>"; // Replace with your secret key
const baseURL = "https://test-nbe.gateway.mastercard.com/api/rest/version/73";

// Utility function to sign requests
function signRequest(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const dataToSign = sortedKeys.map((key) => `${key}=${params[key]}`).join(",");
  return crypto.createHmac("sha256", secretKey).update(dataToSign).digest("base64");
}

// Endpoint to create a session for payment
// app.post('/api/create-session', async (req, res) => {
//   const { orderId, userId } = req.body;

//   try {
//     const booking = await Booking.findById(orderId);
//     if (!booking) {
//       return res.status(404).json({ error: 'Booking not found' });
//     }
// if (booking.user!=userId)
//   {
//       return res.status(404).json({ error: 'user not found' });
//     }
//     const auth = Buffer.from(`merchant.${merchantId}:${password}`).toString('base64');
//     const url = `${baseURL}/merchant/${merchantId}/session`;
//     const headers = {
//       'Authorization': `Basic ${auth}`,
//       'Content-Type': 'application/json',
//     };
//     const data = {
//       apiOperation: 'INITIATE_CHECKOUT',
//       interaction: {
//         returnUrl:`https://keytor.com/api/payment-callback?orderId=${orderId}`,
//         operation: 'PURCHASE',
//         merchant: { name: 'Nbe Test' },
//       },
//       order: {
//         currency: 'EGP',
//         amount: booking.totalPrice.toString(),
//         id: orderId,
//         description: 'Test Order',
//       },

//     };
//     const response = await axios.post(url, data, { headers });
//     console.log(response)
//        const sessionId = response.data.session.id;
//       const successIndicator = response.data.successIndicator;

//       // Update the booking document with sessionId and successIndicator
//       // booking.sessionId = sessionId;
//       // booking.successIndicator = successIndicator;
//       booking.printurl=`https://test-nbe.gateway.mastercard.com/checkout/pay/${sessionId}?checkoutVersion=1.0.0`
//       await booking.save({validateBeforeSave:false});
//     res.status(200).json({ sessionId:response.data,url:`https://test-nbe.gateway.mastercard.com/checkout/pay/${response.data.session.id}?checkoutVersion=1.0.0`  });
//   } catch (error) {
//     console.error('Error creating session:', error);
//     res.status(500).json({ error: 'Session creation failed' });
//   }
// });

app.get("/aaa", async (req, res) => {
  const { orderId, userId } = req.body;
  const notificationToSend = {
    token:
      "csEVRSCATN2FTtkZo9F7wE:APA91bFgDguWjHGMktKej5T1h3nd_6WwrIDEdNn2RCuJb5iuX1bnkfDmQffrt_54nBx6GSd-ZPG-NJl4b_Z5nhrGhLidvz5oEHdM8RSGCSi1d8l9TJfyu-g",
    notification: { title: "talaat", body: "message" },
  };
  admin.messaging().send(notificationToSend);
});
app.post("/api/create-session", async (req, res) => {
  const { orderId, userId } = req.body;

  try {
    // Find the booking by orderId (which is the _id in this case)
    const booking = await Booking.findById(orderId);
    if (booking.tour.capacity === "full") {
      return res.status(400).json({ error: "The tour is full" });
    }
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.status != "pending") {
      return res.status(400).json({ error: "this tour maybe cancelled or full capacity" });
    }
    if (booking.user != userId) {
      return res.status(404).json({ error: "user not found" });
    }

    // Prepare authentication and headers for the Mastercard API
    const auth = Buffer.from(`merchant.${merchantId}:${password}`).toString("base64");
    const url = `${baseURL}/merchant/${merchantId}/session`;
    const headers = {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    };

    // Prepare data for the API request
    const data = {
      apiOperation: "INITIATE_CHECKOUT",
      interaction: {
        // returnUrl: `http://localhost:9000/api/payment-callback?orderId=${orderId}`,
        returnUrl: `https://keytor.com/api/payment-callback?orderId=${orderId}`, // Dynamic callback URL with orderId

        // Dynamic callback URL with orderId
        operation: "PURCHASE",
        merchant: { name: "Nbe Test" },
      },
      order: {
        currency: "EGP",
        amount: booking.totalPrice.toString(),
        id: orderId,
        description: booking.tour.brief.slice(0, 50),
      },
    };

    // console.log(booking.tour.brief)

    // Make the API request to create a session
    const response = await axios.post(url, data, { headers });

    // Extract session ID and success indicator from the response
    const sessionId = response.data.session.id;
    const successIndicator = response.data.successIndicator;
    await Booking.updateOne(
      { _id: orderId, status: { $in: ["pending"] } },
      {
        $set: {
          printurl: `https://test-nbe.gateway.mastercard.com/checkout/pay/${sessionId}?checkoutVersion=1.0.0`,
          sessionId,
          successIndicator,
        },
      }
    );
    // Update the booking document with sessionId and successIndicator
    // booking.sessionId = sessionId;
    // booking.successIndicator = successIndicator;
    // booking.printurl=`https://test-nbe.gateway.mastercard.com/checkout/pay/${sessionId}?checkoutVersion=1.0.0`
    // await booking.save({validateBeforeSave:false});

    // Send the payment URL in the response

    responsea(
      res,
      200,
      {
        sessionId: sessionId,
        paymentUrl: `https://test-nbe.gateway.mastercard.com/checkout/pay/${sessionId}?checkoutVersion=1.0.0`,
      },
      "Payment Link retrieved successfully",
      {}
    );
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Session creation failed" });
  }
});

app.get("/api/order-success", (req, res) => {
  const sessionId = req.query.sessionId; // Or any other relevant data passed

  // Fetch payment status using the session ID from Mastercard (if needed)

  // Render the success page with order details
  res.send("Payment was successful! Thank you for your purchase.");
});

app.get("/api/payment-callback", async (req, res) => {
  const { resultIndicator, orderId } = req.query;

  try {
    // Find the booking by orderId
    const booking = await Booking.findById(orderId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Find the user related to this booking
    const user = await User.findById(booking.user);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the resultIndicator from the callback with the stored successIndicator
    if (resultIndicator === booking.successIndicator) {
      // Payment is successful
      booking.paymentStatus = "paid";
      booking.status = "confirmed"; // Confirm the booking
      await booking.save({ validateBeforeSave: false });

      // Send a success notification to the user
      if (user.isLogin && user.fcmtoken) {
        const message = {
          notification: {
            title: "Payment Successful",
            body: `Your payment for booking ${booking._id} was successful. Your booking is now confirmed.`,
          },
          token: user.fcmtoken,
        };

        // Send notification via FCM
        await admin.messaging().send(message);

        // Save the notification in the database
        const notification = new Notification({
          user: user._id,
          tourid: booking.tour._id,
          title: "Payment Successful",
          message: `Your payment for booking was successful. Your booking is now confirmed.`,
        });
        await notification.save();
      }

      const successHtml = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin-top: 50px;
                background-color: #f0f8ff;
              }
              .button {
                background-color: #4CAF50;
                color: white;
                padding: 15px 32px;
                font-size: 18px;
                cursor: pointer;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
              }
              .button:hover {
                background-color: #45a049;
              }
            </style>
          </head>
          <body>
            <h1>Payment Successful!</h1>
            <p>Your payment for booking <strong>${booking._id}</strong> was successful. Your booking is now confirmed.</p>
            <br>
                       <a href="/" class="button">Go to Home</a>
          </body>
        </html>
      `;

      res.status(200).send(successHtml);

      // res.status(200).send('Payment was successful! Your booking is confirmed.');
    } else {
      // Payment failed
      booking.paymentStatus = "unpaid";
      booking.status = "pending"; // Keep the booking pending
      await booking.save();

      // Send a failure notification to the user
      if (user.isLogin && user.fcmtoken) {
        const message = {
          notification: {
            title: "Payment Failed",
            body: `Your payment for booking has failed. Please try again.`,
          },
          token: user.fcmtoken,
        };

        // Send notification via FCM
        await admin.messaging().send(message);

        // Save the notification in the database
        const notification = new Notification({
          user: user._id,
          tourid: booking.tour._id,
          title: "Payment Failed",
          message: `Your payment for booking  has failed. Please try again.`,
        });
        await notification.save();
      }

      res.status(400).send("Payment failed. Please try again.");
    }
  } catch (error) {
    console.error("Error in payment callback:", error);
    res.status(500).send("Payment callback failed");
  }
});

// app.get('/api/payment-callback', async (req, res) => {
//   const { resultIndicator, orderId } = req.query;

//   try {
//     // Find the booking by orderId
//     const booking = await Booking.findById(orderId);
//     if (!booking) {
//       return res.status(404).json({ error: 'Booking not found' });
//     }

//     // Compare the resultIndicator from the callback with the stored successIndicator
//     if (resultIndicator === booking.successIndicator) {
//       // Payment is successful
//       booking.paymentStatus = 'paid';
//       booking.status = 'confirmed'; // Confirm the booking
//       await booking.save();
//       res.status(200).send('Payment was successful! Your booking is confirmed.');
//     } else {
//       // Payment failed
//       booking.paymentStatus = 'unpaid';
//       booking.status = 'pending'; // Keep the booking pending
//       await booking.save();
//       res.status(400).send('Payment failed. Please try again.');
//     }
//   } catch (error) {
//     console.error('Error in payment callback:', error);
//     res.status(500).send('Payment callback failed');
//   }
// });

// app.get('/api/payment-callback', (req, res) => {
//     // const { result, orderId, transactionId } = req.query;
//   console.log(req.query)
//     // if (result === 'SUCCESS') {
//     //   console.log('Payment successful:', req.query);
//     //   // Handle the success case, e.g., save to database, update order status, etc.
//     //   res.status(200).send('Payment Success');
//     // } else {
//     //   console.log('Payment failed:', req.query);
//     //   // Handle the failure case
//     //   res.status(400).send('Payment Failed');
//     // }
//   });

// Import axios for HTTP requests

// // Replace with your Cybersource Secure Acceptance keys
// const secretKey = '98b4f4a1e5ec4551a3abe9cc3867f576d8c96f62bf6f4d32870b68078ddb8d73a0a41fc5b7864717a92fc755ecb734ba5737de3d9808454b837047f62b80464263c6f80028184ffbb496f5ecf70f89060bb88bf2ed9f424782fd854ffdf92a0e68f038d306fc4ec79e50998d1c6edb9cda854e08909b44e0af56e36c54a4a2b8';  // Secret Key
// const accessKey = '10d395e7ada0385c90cb61ecd6f9e277';  // Access Key
// const profileId = '4BD18904-E21E-4D81-A408-0912F9F0FE0A';

// app.get('/api/payment/success', (req, res) => {
//     // Query parameters sent by the payment gateway
//     const status = req.query.status;
//     const transactionId = req.query.transaction_id;

//     // Handle success
//     if (status === 'success') {
//         res.send(`Payment successful! Transaction ID: ${transactionId}`);
//     } else {
//         res.send('Payment was successful, but no transaction ID was found.');
//     }
// });

// // Route to handle failed payment
// app.get('/api/payment/failure', (req, res) => {
//     // Query parameters sent by the payment gateway
//     const error = req.query.error;

//     // Handle failure
//     res.send(`Payment failed. Error: ${error}`);
// });

// app.post('/api/make-payment', async (req, res) => {
//     // Extract the necessary payment data from the request
//     const { transaction_type, reference_number, amount, currency } = req.body;
// console.log("object")
//     // Build the payment data
//     const paymentData = {
//         access_key: accessKey,
//         profile_id: profileId,
//         transaction_uuid: crypto.randomBytes(16).toString('hex'),
//         signed_field_names: 'access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency',
//         unsigned_field_names: '',
//         signed_date_time: new Date().toISOString(),
//         locale: 'en',
//         transaction_type: transaction_type || 'authorization',
//         reference_number: reference_number || new Date().getTime().toString(),
//         amount: amount || '100.00',
//         currency: currency || 'USD'
//     };

//     // Generate the signature
//     const signature = sign(paymentData, secretKey);
//     paymentData.signature = signature;  // Add the signature to the data

//     try {
//         // Make the POST request to Cybersource
//         const response = await axios.post('https://testsecureacceptance.cybersource.com/pay', paymentData, {
//             headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
//         });
//         console.log(response.data);
//         // Handle the response
//         res.send(response.data);  // Send the Cybersource response back to the client
//     } catch (error) {
//         // Handle any errors
//         console.error(error);
//         res.status(500).send('Payment failed.');
//     }
// });

// // Function to generate the HMAC SHA256 signature
// function sign(params, secretKey) {
//     const signedFieldNames = params.signed_field_names.split(',');
//     const dataToSign = signedFieldNames.map(field => `${field}=${params[field]}`).join(',');
//     return crypto.createHmac('sha256', secretKey).update(dataToSign).digest('base64');
// }

// mongoose.connect(process.env.DB, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// });
// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//     console.log('Connected to MongoDB');
// });

app.use("/uploads/images", express.static(path.join(__dirname, "/uploads/images")));
// Example route
app.use(cookieParser());
app.use(passport.initialize());
// Routes

app.use("/api/tours", tourRoutes);
app.use("/api/adminnotifications", adminNotification);
app.use('/api/v2/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/v2/payments', paymentRoutes);
app.use('/api/v2', v2Routes);
app.use('/api/v2/destinations', destinationRoutesv2);
app.use("/api/availbilty", availablityRoutes);

app.use("/api/notification", notificationRoutes);

app.use("/api/questions", questionsRoutes);
app.use("/api/app-settings", settingRoutes);
app.use("/api/homescreen", homeScreenRoutes);
app.use("/api/faqs", faqRoutes);

app.use("/api/tour-guides", tourguidesRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/blogs", blogRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/about-us", aboutusRoutes);

app.use("/api/bookings", bookingRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", eventRoutes);
app.use("/api/destinations", destinationRoutes);
//////////////////admin
app.use("/api/admin", adminRoutes);

app.use(express.static(path.join(__dirname, "./build")));
app.get("/*", async (req, res) => {
  await res.sendFile(path.resolve("./build/index.html"));
});
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(errorHandler);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
