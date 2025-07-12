import axios from 'axios';

const API_URL = 'http://localhost:3333';
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoiamFuZS5tYW5hZ2VyQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiRW1wbG95ZWUiLCJNYW5hZ2VyIl0sImNvbXBhbnlJZCI6MSwiZ29vZ2xlRW1haWwiOm51bGwsImlhdCI6MTc1MjM1MjM1MiwiZXhwIjoxNzUyNDM4NzUyfQ.Ka9rwnhrLXQjxm09eSJIpUnz4WlL66EN8ENM-6ea3HM';
const USER_IDS = Array.from({ length: 13 }, (_, i) => i + 2); // [2..14]
const senderId = 2; // Start sender (loop will override anyway)

const titles = [
  'Quarterly Performance',
  'Team Communication',
  'Cross-Functional Impact',
  'Delivery Ownership',
  'Leadership Growth',
];

const feedbacks = [
  {
    text: 'You’ve shown great initiative in driving tasks forward.',
    sentiment: 'POSITIVE',
  },
  { text: 'Consider improving documentation clarity.', sentiment: 'NEUTRAL' },
  { text: 'Excellent team support and collaboration!', sentiment: 'POSITIVE' },
  {
    text: 'Your feedback during retros was insightful.',
    sentiment: 'POSITIVE',
  },
  {
    text: 'Would love to see more engagement during sprint planning.',
    sentiment: 'NEUTRAL',
  },
  {
    text: 'There was a noticeable delay in your recent deliverables.',
    sentiment: 'NEGATIVE',
  },
  {
    text: 'We need more proactive communication from your side.',
    sentiment: 'NEGATIVE',
  },
  {
    text: 'The presentation lacked clarity and structure.',
    sentiment: 'NEGATIVE',
  },
];

const tags = [
  'Performance',
  'Teamwork',
  'Leadership',
  'Collaboration',
  'Ownership',
];
const visibilities = ['PUBLIC', 'MANAGER_ONLY', 'MANAGER_PRIVATE', 'ANONYMOUS'];

async function seedFeedbacks() {
  for (const senderId of USER_IDS) {
    const receivers = USER_IDS.filter((id) => id !== senderId);
    const receiverId = receivers[Math.floor(Math.random() * receivers.length)];
    const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    const isAnonymous = Math.random() > 0.7;
    const visibilityType = isAnonymous
      ? 'ANONYMOUS'
      : visibilities[Math.floor(Math.random() * (visibilities.length - 1))];
    const payload = {
      feedbackTitle: titles[Math.floor(Math.random() * titles.length)],
      feedbackText: feedback.text,
      isAnonymous: Math.random() > 0.7,
      visibilityType: visibilityType,
      receiverId,
      tags: [
        tags[Math.floor(Math.random() * tags.length)],
        tags[Math.floor(Math.random() * tags.length)],
      ],
      // Optionally inject sentiment if your backend supports it
      // sentiment: feedback.sentiment,
    };

    try {
      const res = await axios.post(`${API_URL}/feedback`, payload, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

      console.log(
        `✅ Sender ${senderId} ➝ Receiver ${receiverId} | Sentiment: ${feedback.sentiment} | Feedback ID: ${res.data.id}`,
      );
    } catch (error) {
      console.error(
        `❌ Sender ${senderId} ➝ Receiver ${receiverId}`,
        error.response?.data || error.message,
      );
    }
  }
}

seedFeedbacks();
