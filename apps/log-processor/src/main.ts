import { Client } from '@opensearch-project/opensearch';
import { CloudWatchLogsDecodedData, CloudWatchLogsHandler } from 'aws-lambda';
import * as zlib from 'zlib';

const prefix = process.env.PREFIX;
const env = process.env.NODE_ENV;

const client = new Client({
  node: process.env.OPENSEARCH_URL,
  headers: {
    Authorization: `Bearer ${process.env.OPENSEARCH_TOKEN}`,
  },
});

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const logsHandler: CloudWatchLogsHandler = async (event) => {
  try {
    const payload = Buffer.from(event.awslogs.data, 'base64');
    const decompressed = zlib.gunzipSync(payload).toString('utf-8');

    const parsed = JSON.parse(decompressed) as CloudWatchLogsDecodedData;
    // console.log('Parsed Log Events:', parsed);

    const body = parsed.logEvents.flatMap((logEvent) => {
      const eventMessage = JSON.parse(logEvent.message);
      const date = new Date(eventMessage['@timestamp']);

      return [
        { index: { _index: `${prefix}-${env}-${formatDate(date)}` } },
        {
          ...eventMessage,
        },
      ];
    });
    // console.log({ body });

    const response = await client.bulk({ body });
    if (response.statusCode !== 200) {
      // eslint-disable-next-line no-console
      console.error('Error indexing logs:', response);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing logs:', error);
  }
};
