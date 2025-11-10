import Web3 from 'web3';

export const getWeb3 = () => {
  if (window.ethereum) {
    return new Web3(window.ethereum);
  }
  return null;
};

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }

  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });

  return accounts[0];
};

export const getNetworkId = async (web3) => {
  const chainId = await web3.eth.getChainId();
  // Convertir BigInt a Number para comparación
  return Number(chainId);
};

export const switchToSonicNetwork = async () => {
  const sonicConfig = {
    chainId: '0x3909', // 14601 decimal = 0x3909 hexadecimal
    chainName: 'Sonic Testnet',
    nativeCurrency: {
      name: 'Sonic',
      symbol: 'S',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.testnet.soniclabs.com'],
    blockExplorerUrls: ['https://testnet.soniclabs.com/'],
  };

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: sonicConfig.chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [sonicConfig],
      });
    } else {
      throw switchError;
    }
  }
};
