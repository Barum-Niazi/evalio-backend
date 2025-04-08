import { Injectable } from '@nestjs/common';
const { pipeline } = require('@huggingface/transformers');

@Injectable()
export class SentimentAnalysisService {
  private model: any;

  constructor() {
    this.loadModel();
  }

  // Method to load the model asynchronously
  private async loadModel() {
    try {
      let pipe = await pipeline('sentiment-analysis');
      this.model = pipe; // Assign the loaded model to the class property
    } catch (error) {
      console.error('Error loading model:', error);
      throw new Error('Failed to load model');
    }
  }

  // Method to analyze sentiment
  async analyzeSentiment(feedbackText: string): Promise<string> {
    if (!this.model) {
      throw new Error('Model not loaded');
    }
    try {
      const result = await this.model(feedbackText);

      // Assuming the result contains a `label` (e.g., 'positive', 'negative', 'neutral')
      const sentiment = result[0]?.label || 'neutral'; // Default to 'neutral' if no sentiment is detected

      return sentiment;
    } catch (error) {
      console.error('Error during sentiment analysis:', error);
      throw new Error('Sentiment analysis failed');
    }
  }
}
