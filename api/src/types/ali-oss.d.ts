declare module 'ali-oss' {
  class OSS {
    constructor(options: Record<string, any>);
    signatureUrl(filePath: string, options?: Record<string, any>): string;
    put(filePath: string, file: any): Promise<any>;
    delete(filePath: string): Promise<any>;
  }

  export default OSS;
}
