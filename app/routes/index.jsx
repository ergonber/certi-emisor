import { useState, useEffect } from 'react';
import Web3 from 'web3';

export default function CreateCertificate() {
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '', 
    courseHash: ''
  });
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // CONFIGURACIÓN
  const CONTRACT_ADDRESS = "0xa3081cd8f09dee3e5f0bcff197a40ff90720a05f";
  const SONIC_RPC_URL = "https://rpc.testnet.soniclabs.com";
  const SONIC_CHAIN_ID = 14601; // ChainID de Sonic Testnet

  // ABI expandido para creación de certificados
  const CONTRACT_ABI = [
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

  // Configuración de Sonic Testnet para MetaMask
  const sonicTestnetConfig = {
    chainId: `0x${SONIC_CHAIN_ID.toString(16)}`,
    chainName: 'Sonic Testnet',
    nativeCurrency: {
      name: 'Sonic',
      symbol: 'S',
      decimals: 18,
    },
    rpcUrls: [SONIC_RPC_URL],
    blockExplorerUrls: ['https://testnet.soniclabs.com/'],
  };

  useEffect(() => {
    checkWalletConnection();
    setupEventListeners();
  }, []);

 const checkWalletConnection = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        const web3Instance = new Web3(window.ethereum);
        const networkId = await web3Instance.eth.getChainId();
        
        // Convertir BigInt a Number
        const networkIdNumber = Number(networkId);
        
        console.log("🔗 ChainID detectado:", networkId);
        console.log("🔗 ChainID convertido:", networkIdNumber);
        console.log("🔗 ChainID esperado:", SONIC_CHAIN_ID);
        console.log("🔗 ¿Red correcta?", networkIdNumber === SONIC_CHAIN_ID);
        
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setNetworkId(networkIdNumber); // Guardar como Number
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  }
};

const setupEventListeners = () => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null);
        setWeb3(null);
        setNetworkId(null);
      }
    });

    window.ethereum.on('chainChanged', (chainId) => {
      // chainId viene como string hexadecimal, convertir a Number
      const newChainId = parseInt(chainId, 16);
      setNetworkId(newChainId);
      window.location.reload();
    });
  }
};

      window.ethereum.on('chainChanged', (chainId) => {
        setNetworkId(parseInt(chainId, 16));
        window.location.reload();
      });
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Por favor instala MetaMask para usar esta aplicación');
      return;
    }

    setIsConnecting(true);
    try {
      // Solicitar conexión de cuenta
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const web3Instance = new Web3(window.ethereum);
      const currentChainId = await web3Instance.eth.getChainId();

      // Verificar si estamos en Sonic Testnet
      if (currentChainId !== SONIC_CHAIN_ID) {
        await switchToSonicNetwork();
      }

      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setNetworkId(currentChainId);

    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        alert('Por favor conecta tu wallet para continuar');
      }
    }
    setIsConnecting(false);
  };

  const switchToSonicNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sonicTestnetConfig.chainId }],
      });
    } catch (switchError) {
      // Si la red no existe en MetaMask, agregarla
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [sonicTestnetConfig],
          });
        } catch (addError) {
          console.error('Error adding Sonic network:', addError);
          throw new Error('No se pudo agregar Sonic Testnet a MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createCertificate = async (e) => {
    e.preventDefault();
    
    if (!account) {
      alert('Por favor conecta tu wallet primero');
      return;
    }

    if (networkId !== SONIC_CHAIN_ID) {
      alert('Por favor cambia a Sonic Testnet en MetaMask');
      return;
    }

    setLoading(true);
    setTransactionStatus(null);

    try {
      console.log("🚀 INICIANDO CREACIÓN DE CERTIFICADO");
      console.log("📝 Datos:", formData);
      console.log("👤 Cuenta:", account);

      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      // Estimar gas
      const gasEstimate = await contract.methods.createCertificate(
        formData.studentName,
        formData.courseName, 
        formData.courseHash
      ).estimateGas({ from: account });

      console.log("⛽ Gas estimado:", gasEstimate);

      // Enviar transacción
      const transaction = await contract.methods.createCertificate(
        formData.studentName,
        formData.courseName, 
        formData.courseHash
      ).send({ 
        from: account,
        gas: Math.floor(gasEstimate * 1.2) // Añadir 20% de margen
      });

      console.log("✅ Transacción exitosa:", transaction);

      // Obtener el certificateId desde los eventos (si está disponible)
      let certificateId = "No disponible en eventos";
      if (transaction.events && transaction.events.CertificateCreated) {
        certificateId = transaction.events.CertificateCreated.returnValues.certificateId;
      }

      setTransactionStatus({
        success: true,
        transactionHash: transaction.transactionHash,
        certificateId: certificateId,
        message: "🎉 Certificado creado exitosamente en Sonic Testnet!",
        blockNumber: transaction.blockNumber
      });

      // Limpiar formulario
      setFormData({
        studentName: '',
        courseName: '',
        courseHash: ''
      });

    } catch (error) {
      console.error("💥 ERROR:", error);
      
      let errorMessage = "Error al crear el certificado";
      
      if (error.code === 4001) {
        errorMessage = "Transacción rechazada por el usuario";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "Fondos insuficientes para pagar el gas";
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "El contrato rechazó la transacción";
      }

      setTransactionStatus({
        success: false,
        error: error.message,
        message: errorMessage
      });
    }

    setLoading(false);
  };

  const disconnectWallet = () => {
    setAccount(null);
    setWeb3(null);
    setNetworkId(null);
  };

  const isCorrectNetwork = networkId === SONIC_CHAIN_ID;

  return (
    <div className="container">
      <header>
        <h1>🎓 Creador de Certificados</h1>
        <p>Crear certificados digitales en <strong>SONIC TESTNET</strong></p>
        
        <div className="wallet-section">
          {!account ? (
            <button 
              onClick={connectWallet} 
              className="connect-btn"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <div className="spinner-small"></div>
                  Conectando...
                </>
              ) : (
                '🔗 Conectar MetaMask'
              )}
            </button>
          ) : (
            <div className="wallet-info">
              <div className="account-info">
                <span className="network-badge" data-status={isCorrectNetwork ? 'connected' : 'wrong'}>
                  {isCorrectNetwork ? '✅ Sonic Testnet' : '❌ Red Incorrecta'}
                </span>
                <span className="account-address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
              <button onClick={disconnectWallet} className="disconnect-btn">
                Desconectar
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        {!account ? (
          <div className="not-connected">
            <div className="connection-prompt">
              <h2>🔗 Conecta tu Wallet</h2>
              <p>Para crear certificados, necesitas conectar tu wallet de MetaMask</p>
              <button onClick={connectWallet} className="connect-btn large">
                🔗 Conectar MetaMask
              </button>
              <div className="help-text">
                <p><strong>Requisitos:</strong></p>
                <ul>
                  <li>✅ MetaMask instalado</li>
                  <li>✅ Cuenta con fondos para gas</li>
                  <li>✅ Red Sonic Testnet (ChainID: 14601)</li>
                </ul>
              </div>
            </div>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="wrong-network">
            <div className="network-prompt">
              <h2>🌐 Red Incorrecta</h2>
              <p>Por favor cambia a Sonic Testnet en tu MetaMask</p>
              <button onClick={switchToSonicNetwork} className="network-switch-btn">
                🔄 Cambiar a Sonic Testnet
              </button>
              <div className="network-info">
                <p><strong>Configuración de Sonic Testnet:</strong></p>
                <ul>
                  <li><strong>Network Name:</strong> Sonic Testnet</li>
                  <li><strong>RPC URL:</strong> {SONIC_RPC_URL}</li>
                  <li><strong>Chain ID:</strong> 14601</li>
                  <li><strong>Currency Symbol:</strong> S</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-container">
            <form onSubmit={createCertificate} className="certificate-form">
              <div className="form-group">
                <label htmlFor="studentName">
                  👤 Nombre del Estudiante
                </label>
                <input
                  type="text"
                  id="studentName"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre completo del estudiante"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="courseName">
                  📚 Nombre del Curso
                </label>
                <input
                  type="text"
                  id="courseName"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  placeholder="Ingresa el nombre del curso o evento"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="courseHash">
                  🔗 Hash del Curso (Arweave)
                </label>
                <input
                  type="text"
                  id="courseHash"
                  name="courseHash"
                  value={formData.courseHash}
                  onChange={handleInputChange}
                  placeholder="Ingresa el hash de Arweave del contenido"
                  required
                  disabled={loading}
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading || !formData.studentName || !formData.courseName || !formData.courseHash}
              >
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Creando Certificado...
                  </>
                ) : (
                  '🎉 Crear Certificado'
                )}
              </button>
            </form>

            {transactionStatus && (
              <div className={`transaction-result ${transactionStatus.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <h3>
                    {transactionStatus.success ? '✅ Éxito' : '❌ Error'}
                  </h3>
                  <p>{transactionStatus.message}</p>
                </div>
                
                {transactionStatus.success && (
                  <div className="transaction-details">
                    <div className="detail-row">
                      <strong>📫 Hash de Transacción:</strong>
                      <code>{transactionStatus.transactionHash}</code>
                    </div>
                    <div className="detail-row">
                      <strong>🆔 ID del Certificado:</strong>
                      <code>{transactionStatus.certificateId}</code>
                    </div>
                    {transactionStatus.blockNumber && (
                      <div className="detail-row">
                        <strong>🔢 Block Number:</strong>
                        <span>{transactionStatus.blockNumber}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {transactionStatus.error && (
                  <div className="error-details">
                    <p><strong>Error detallado:</strong></p>
                    <code className="error-code">{transactionStatus.error}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="system-info">
          <h3>🔧 Información del Sistema</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Red Blockchain:</strong> Sonic Testnet
            </div>
            <div className="info-item">
              <strong>ChainID:</strong> 14601
            </div>
            <div className="info-item">
              <strong>Contrato:</strong> 
              <code>{CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}</code>
            </div>
            <div className="info-item">
              <strong>Estado:</strong> 
              <span className={`status ${account ? (isCorrectNetwork ? 'connected' : 'wrong-network') : 'disconnected'}`}>
                {account ? (isCorrectNetwork ? '✅ Conectado' : '❌ Red Incorrecta') : '🔌 Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          min-height: 100vh;
        }
        
        header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        h1 {
          color: #2c5530;
          margin-bottom: 10px;
        }
        
        .wallet-section {
          margin-top: 20px;
        }
        
        .connect-btn {
          padding: 12px 24px;
          background: #f6851b;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .connect-btn:hover:not(:disabled) {
          background: #e2761b;
        }
        
        .connect-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .connect-btn.large {
          padding: 15px 30px;
          font-size: 16px;
        }
        
        .wallet-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          border: 2px solid #e9ecef;
        }
        
        .account-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .network-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .network-badge[data-status="connected"] {
          background: #d4edda;
          color: #155724;
        }
        
        .network-badge[data-status="wrong"] {
          background: #f8d7da;
          color: #721c24;
        }
        
        .account-address {
          background: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }
        
        .disconnect-btn {
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .disconnect-btn:hover {
          background: #5a6268;
        }
        
        .not-connected, .wrong-network {
          background: white;
          padding: 40px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          text-align: center;
          margin-bottom: 30px;
        }
        
        .connection-prompt, .network-prompt {
          max-width: 400px;
          margin: 0 auto;
        }
        
        .help-text, .network-info {
          margin-top: 25px;
          text-align: left;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
        }
        
        .help-text ul, .network-info ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .network-switch-btn {
          padding: 15px 25px;
          background: #2c5530;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin: 15px 0;
        }
        
        .form-container {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .certificate-form {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        label {
          font-weight: bold;
          margin-bottom: 8px;
          color: #495057;
          font-size: 14px;
        }
        
        input {
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
        }
        
        input:focus {
          outline: none;
          border-color: #2c5530;
          box-shadow: 0 0 0 3px rgba(44, 85, 48, 0.1);
        }
        
        input:disabled {
          background-color: #f8f9fa;
          cursor: not-allowed;
        }
        
        .submit-btn {
          padding: 15px 20px;
          background: #2c5530;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #1e3a23;
          transform: translateY(-2px);
        }
        
        .submit-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
        }
        
        .spinner-small {
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
        }
        
        .transaction-result {
          margin-top: 25px;
          padding: 20px;
          border-radius: 10px;
          border-left: 4px solid;
        }
        
        .transaction-result.success {
          background: #d4edda;
          border-color: #28a745;
          color: #155724;
        }
        
        .transaction-result.error {
          background: #f8d7da;
          border-color: #dc3545;
          color: #721c24;
        }
        
        .result-header {
          margin-bottom: 15px;
        }
        
        .result-header h3 {
          margin: 0 0 5px 0;
        }
        
        .transaction-details {
          background: rgba(255,255,255,0.5);
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
        
        .detail-row {
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
        }
        
        .detail-row strong {
          margin-bottom: 5px;
        }
        
        code {
          background: rgba(0,0,0,0.1);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          word-break: break-all;
          font-family: 'Courier New', monospace;
        }
        
        .error-code {
          background: rgba(0,0,0,0.2);
          color: #721c24;
          margin-top: 10px;
        }
        
        .system-info {
          background: white;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        
        .info-item {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          font-size: 14px;
        }
        
        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .status.connected {
          background: #d4edda;
          color: #155724;
        }
        
        .status.wrong-network {
          background: #fff3cd;
          color: #856404;
        }
        
        .status.disconnected {
          background: #f8d7da;
          color: #721c24;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          header {
            padding: 20px;
          }
          
          .form-container {
            padding: 20px;
          }
          
          .wallet-info {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
