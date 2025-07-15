export const environment = {
  production: true,
  apiUrl: 'https://41ot62efvg.execute-api.us-east-1.amazonaws.com/prod/contact',
  apiKey: '${API_KEY_PROD}',
  endpointInitProcess: 'https://3rlvd3x9a3.execute-api.us-east-1.amazonaws.com/prod/submission-init',
  endpointCompleteDocuments: 'https://3rlvd3x9a3.execute-api.us-east-1.amazonaws.com/prod/submission-done',
  endpointListFiles: 'https://3rlvd3x9a3.execute-api.us-east-1.amazonaws.com/prod/download',
  endpointGenerateDownloadLink: 'https://3rlvd3x9a3.execute-api.us-east-1.amazonaws.com/prod/generate-download-link'
}; 