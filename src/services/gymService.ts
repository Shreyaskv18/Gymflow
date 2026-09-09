import { Gym } from '../types';
import { storageService } from './storageService';

export interface UpdateGymPayload {
  name: string;
  phone: string;
  email: string;
  address: string;
}

class GymService {
  public async getGymDetails(): Promise<Gym> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return storageService.getGym();
  }

  public async updateGymDetails(payload: UpdateGymPayload): Promise<{ success: boolean; gym?: Gym; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!payload.name.trim()) {
      return { success: false, error: 'Gym name cannot be empty.' };
    }
    if (!payload.phone.trim()) {
      return { success: false, error: 'Phone number is required.' };
    }
    if (!payload.email.trim()) {
      return { success: false, error: 'Email address is required.' };
    }
    if (!payload.address.trim()) {
      return { success: false, error: 'Address is required.' };
    }

    const currentGym = storageService.getGym();
    const updatedGym: Gym = {
      ...currentGym,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim().toLowerCase(),
      address: payload.address.trim(),
    };

    const saved = storageService.saveGym(updatedGym);
    if (!saved) {
      return { success: false, error: 'Failed to update gym details in storage.' };
    }

    return { success: true, gym: updatedGym };
  }
}

export const gymService = new GymService();
