import axios from 'axios';

const API_URL = 'http://localhost:3333';

const TOKENS = [
  {
    userId: 2,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiam9obi5tYW5hZ2VyQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiRW1wbG95ZWUiXSwiY29tcGFueUlkIjoxLCJnb29nbGVFbWFpbCI6bnVsbCwiaWF0IjoxNzUyNDExMDY0LCJleHAiOjE3NTI0OTc0NjR9.3GdJE35WpPGbrSTmCQCU8_VPJzTNViR8WYCVMLH-EWk',
  },
  {
    userId: 3,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoiamFuZS5tYW5hZ2VyQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiRW1wbG95ZWUiXSwiY29tcGFueUlkIjoxLCJnb29nbGVFbWFpbCI6bnVsbCwiaWF0IjoxNzUyNDA5NDIyLCJleHAiOjE3NTI0OTU4MjJ9.53PsicTD3Iw7w4gcMTzbpkPITy6yhhv2qdVZqSZDFys',
  },
  {
    userId: 6,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImVtYWlsIjoidGF5bG9yLmxlYWRAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJFbXBsb3llZSJdLCJjb21wYW55SWQiOjEsImdvb2dsZUVtYWlsIjpudWxsLCJpYXQiOjE3NTI0MTExMTIsImV4cCI6MTc1MjQ5NzUxMn0.4Y2ZXo-j8b9PSWDMWNVRabJPE1BgDI6ZrwbpYqqSjOY',
  },
  {
    userId: 10,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwLCJlbWFpbCI6InRheWxvci5kb2VAZXhhbXBsZS5jb20iLCJyb2xlcyI6WyJFbXBsb3llZSJdLCJjb21wYW55SWQiOjEsImdvb2dsZUVtYWlsIjoiYmFydW1raGFuMTIzQGdtYWlsLmNvbSIsImlhdCI6MTc1MjQxMDk1NywiZXhwIjoxNzUyNDk3MzU3fQ.zj12qWCkmPyo0n9OxgVh0ZRd_6fz0E9B2mBRbM70Cqo',
  },
  {
    userId: 9,
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjksImVtYWlsIjoiYWxleC5wYXRlbEBleGFtcGxlLmNvbSIsInJvbGVzIjpbIkVtcGxveWVlIl0sImNvbXBhbnlJZCI6MSwiZ29vZ2xlRW1haWwiOm51bGwsImlhdCI6MTc1MjQxMDk3OSwiZXhwIjoxNzUyNDk3Mzc5fQ.4hl6Ipn6DS3KbmoU9-c8bPWRg_xyb7dNGQ7nL5SPOTw',
  },
  // Add more user-token pairs as needed
];

const USER_IDS = TOKENS.map(({ userId }) => userId);

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
const visibilities = ['PUBLIC', 'MANAGER_ONLY', 'MANAGER_PRIVATE'];

function getRandomElements(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return [...new Set(shuffled.slice(0, count))];
}

async function seedFeedbacks(feedbackCount = 35) {
  for (let i = 0; i < feedbackCount; i++) {
    const senderData = TOKENS[Math.floor(Math.random() * TOKENS.length)];
    const senderId = senderData.userId;
    const token = senderData.token;

    const receivers = USER_IDS.filter((id) => id !== senderId);
    const receiverId = receivers[Math.floor(Math.random() * receivers.length)];
    const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    const isAnonymous = Math.random() < 0.3;
    const visibilityType = isAnonymous
      ? 'ANONYMOUS'
      : visibilities[Math.floor(Math.random() * visibilities.length)];

    const feedbackTags = getRandomElements(
      tags,
      Math.floor(Math.random() * 2) + 1,
    );

    const payload = {
      feedbackTitle: titles[Math.floor(Math.random() * titles.length)],
      feedbackText: feedback.text,
      isAnonymous,
      visibilityType,
      receiverId,
      tags: feedbackTags,
      // sentiment: feedback.sentiment, // Uncomment if your backend supports it
    };

    try {
      const res = await axios.post(`${API_URL}/feedback`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        `✅ #${i + 1} Sender ${senderId} ➝ Receiver ${receiverId} | Sentiment: ${feedback.sentiment} | Visibility: ${visibilityType} | Feedback ID: ${res.data.id}`,
      );
    } catch (error) {
      console.error(
        `❌ #${i + 1} Sender ${senderId} ➝ Receiver ${receiverId}`,
        error.response?.data || error.message,
      );
    }
  }
}

seedFeedbacks(); // default 35 feedbacks
