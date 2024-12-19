import fs from 'fs'
import path from 'path'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
 
// Create an Amazon S3 service client object.
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'FR46RKQH5H6OUSSRC4TYELDGNM',
    secretAccessKey: 'G75HY7YIAIZT5R5NA3M7GMAO4DKBGWWNMYR7C3JWBI2FWHWYK5CQ'
  },
  endpoint: {
    url: 'https://s3.w3s.aioz.network'
  },
  forcePathStyle: true
})
 
// const filePath = 'YOUR_FILE_PATH'
const filePath = process.argv[3];
console.log(filePath)
// Set the bucket parameters
export const bucketParams = {
  Bucket: 'w3ai-platform',
  Key: path.basename(filePath),
  Body: fs.createReadStream(filePath)
}
 
export const run = async () => {
  try {
    const data = await s3Client.send(new PutObjectCommand(bucketParams))
    console.log('Success', data)
  } catch (err) {
    console.log('Error', err)
  }
}
 
run()