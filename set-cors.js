const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  projectId: 'plant-share-bd171'
});

const bucket = storage.bucket('plant-share-bd171.firebasestorage.app');

const corsConfiguration = [
  {
    origin: ['*'],
    method: ['GET', 'HEAD', 'DELETE', 'POST', 'PUT'],
    responseHeader: ['Content-Type'],
    maxAgeSeconds: 3600
  }
];

bucket.setCorsConfiguration(corsConfiguration)
  .then(() => {
    console.log('CORS configuration set successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error setting CORS:', err);
    process.exit(1);
  });
