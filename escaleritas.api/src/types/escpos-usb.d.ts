declare module 'escpos-usb' {
    export class USB {
      constructor(vid?: number, pid?: number);
      open(callback: (error: Error | null) => void): void;
      close(): void;
    }
  }