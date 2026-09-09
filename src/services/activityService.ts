import { Activity } from '../types';
import { storageService } from './storageService';

class ActivityService {
  public async getRecentActivities(limit = 6): Promise<Activity[]> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const activities = storageService.getActivities();
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const activityService = new ActivityService();
