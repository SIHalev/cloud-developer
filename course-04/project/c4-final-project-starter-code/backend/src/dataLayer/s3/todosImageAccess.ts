import {createLogger} from "../../utils/logger";
import * as AWS from "aws-sdk";
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('dataLayer');

export class TodosImageAccess {

    constructor(
        private readonly s3 = new XAWS.S3({signatureVersion: 'v4'}),
        private readonly imagesBucketName = process.env.TODOS_IMAGES_S3_BUCKET,
        private readonly signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION
    ) {
        // NO-OP
    }

    getImageAttachmentUrl(imageId: string): string {
        const attachmentUrl = `https://${this.imagesBucketName}.s3.amazonaws.com/${imageId}`;
        logger.info(`S3 Image link ${attachmentUrl}`);
        return attachmentUrl;
    }

    getImageUploadUrl(imageId: string): string {
        const signedUrl = this.s3.getSignedUrl('putObject', {
            Bucket: this.imagesBucketName,
            Key: imageId,
            Expires: this.signedUrlExpiration
        });

        logger.info(`S3 Image link ${signedUrl}`);
        return signedUrl;
    }

}
