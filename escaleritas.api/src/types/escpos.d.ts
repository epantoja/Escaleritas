declare module 'escpos' {
    export class Printer {
      constructor(device: any);
      cashdraw(pin: number): Printer;
      close(): void;
    }
  
    export class USB {
      constructor(vid?: number, pid?: number);
      open(callback: (error: Error | null) => void): void;
    }
  
    export class Network {
      constructor(address: string, port?: number);
    }
  
    export class Serial {
      constructor(port: string, options?: { baudRate?: number });
    }
  }