import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  getItem(key: string): string | null {
    const value = localStorage.getItem(key);
    console.log(`Getting item from localStorage with key: ${key}, value: ${value}`);
    return value;
  }

  setItem(key: string, value: string): void {
    console.log(`Setting item in localStorage with key: ${key}, value: ${value}`);
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    console.log(`Removing item from localStorage with key: ${key}`);
    localStorage.removeItem(key);
  }
}
