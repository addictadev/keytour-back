const express = require('express');
const Event = require('../model/eventSchema');
const { scheduleAllEvents } = require('../cronScheduler');

const router = express.Router();

// Route to add an event
router.post('/add-event', async (req, res) => {
  const { name, date, time } = req.body;
console.log("object")
  try {
    // Create the event
    const newEvent = new Event({
      name,
      date,
      time,
    });

    // Save the event to the database
    await newEvent.save();

    // Schedule the event cron job
    scheduleAllEvents(newEvent._id, date, time);

    res.status(201).json({ message: 'Event created and cron job scheduled!', event: newEvent });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error creating event' });
  }
});

// Route to fetch all events
router.get('/events', async (req, res) => {
  const events = await Event.find();


  res.json(events);
});

module.exports = router;
