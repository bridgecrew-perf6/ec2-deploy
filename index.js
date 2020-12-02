const AWS = require('aws-sdk');

AWS.config.update({region: 'ap-northeast-1'});

exports.handler = (event, context, callback) => {

  console.log(event);

  const params = {
    DryRun: false,
    SpotFleetRequestConfig: getSpotFleetRequestConfig(),
  };

  console.log(params);

  new AWS.EC2().requestSpotFleet(params, (err, data) => {
    if (err) {
      console.log(err, 'spot fleet request failed');
      callback(err);
    }
    console.log(data, 'spot fleet request succeed');
    callback(null, data);
  });
};

const getSpotFleetRequestConfig = () => {

  const userdata = `#!/bin/sh
curl https://raw.githubusercontent.com/gattyan27/ec2-deploy/master/init.sh | bash -s -- ap-northeast-1 user_id user_name password ssh_port dns_host_zone_id domain volume_id
`;
  const initShell = new Buffer(userdata).toString('base64');

  const instanceSetting = {
    "ImageId": "ami-023a7615a07affbe5",
    "SubnetId": "subnet-8aca1ec2",
    "KeyName": "ichikawa",
    "UserData": initShell,
    "IamInstanceProfile": {
      "Arn": "arn:aws:iam::719786512927:instance-profile/ec2-route53-full"
    },
    "BlockDeviceMappings": [
      {
        "DeviceName": "/dev/sda1",
        "Ebs": {
          "DeleteOnTermination": true,
          "VolumeType": "gp2",
          "VolumeSize": 100,
          "SnapshotId": "snap-0287b7b1792e9d43e"
        }
      }
    ],
    "SecurityGroups": [
      {
        "GroupId": "sg-0449357248af8673f"
      }
    ]
  };

  const launchSpecifications = [
    {
      "InstanceType": "m5.large",
      "SpotPrice": "0.124",
    },
    {
      "InstanceType": "m5n.large",
      "SpotPrice": "0.153",
    },
    {
      "InstanceType": "m5dn.large",
      "SpotPrice": "0.175",
    },
    {
      "InstanceType": "m5d.large",
      "SpotPrice": "0.146",
    },
    {
      "InstanceType": "m5ad.large",
      "SpotPrice": "0.134",
    },
    {
      "InstanceType": "m5a.large",
      "SpotPrice": "0.112",
    },
  ].map(item => Object.assign(Object.assign({}, instanceSetting), item));

  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setHours(validFrom.getHours() + 3);

  return {
    "IamFleetRole": "arn:aws:iam::719786512927:role/aws-ec2-spot-fleet-tagging-role",
    "AllocationStrategy": "lowestPrice",
    "TargetCapacity": 1,
    "SpotPrice": "0.999",
    "ValidFrom": validFrom.toISOString(),
    "ValidUntil": validUntil.toISOString(),
    "TerminateInstancesWithExpiration": true,
    "LaunchSpecifications": launchSpecifications,
    "Type": "request"
  };
};