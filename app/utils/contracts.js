export const CONTRACT_CONFIG = {
  ADDRESS: "0xa3081cd8f09dee3e5f0bcff197a40ff90720a05f",
  SONIC_RPC_URL: "https://rpc.testnet.soniclabs.com",
  CHAIN_ID: 14601
};

export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_recipientName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_eventName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_arweaveHash",
        "type": "string"
      }
    ],
    "name": "createCertificate",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_certificateId",
        "type": "bytes32"
      }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "recipientName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "eventName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "arweaveHash",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "issueDate",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_certificateId",
        "type": "bytes32"
      }
    ],
    "name": "verifyCertificate",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
