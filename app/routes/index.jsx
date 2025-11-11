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

  // CONFIGURACIÓN - ACTUALIZA CON TU NUEVA DIRECCIÓN
  const CONTRACT_ADDRESS = "0xAe48Ed8cD53e6e595E857872b1ac338E17F08549";
  const SONIC_RPC_URL = "https://rpc.testnet.soniclabs.com";
  const SONIC_CHAIN_ID = 14601;

  // ABI ACTUALIZADO - Asegúrate de tener la función createCertificate
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
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "certificateId",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "recipientName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "eventName",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "arweaveHash",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "issueDate",
          "type": "uint256"
        }
      ],
      "name": "CertificateCreated",
      "type": "event"
    }
  ];

  // ... (el resto de tus funciones permanecen igual: sonicTestnetConfig, convertBigIntToNumber, useEffect, checkWalletConnection, etc.)

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
      console.log("📝 Datos del formulario:", formData);
      console.log("👤 Cuenta:", account);
      console.log("🔗 Contrato:", CONTRACT_ADDRESS);

      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      // Verificar balance
      const balance = await web3.eth.getBalance(account);
      console.log("💰 Balance:", web3.utils.fromWei(balance, 'ether'), 'S');

      // Estimar gas
      const gasEstimate = await contract.methods.createCertificate(
        formData.studentName,
        formData.courseName, 
        formData.courseHash
      ).estimateGas({ from: account });

      console.log("⛽ Gas estimado:", gasEstimate);

      // ENVIAR TRANSACCIÓN Y CAPTURAR EL RESULTADO
      console.log("📤 Enviando transacción real...");
      
      const transaction = await contract.methods.createCertificate(
        formData.studentName,
        formData.courseName, 
        formData.courseHash
      ).send({ 
        from: account,
        gas: Math.floor(convertBigIntToNumber(gasEstimate) * 1.2)
      });

      console.log("✅ Transacción exitosa:", transaction);

      // OBTENER EL CERTIFICATE ID DEL RESULTADO DE LA TRANSACCIÓN
      let certificateId = "No se pudo obtener el ID";
      
      // Método 1: Buscar en los eventos
      if (transaction.events && Object.keys(transaction.events).length > 0) {
        console.log("📋 Eventos disponibles:", Object.keys(transaction.events));
        
        // Buscar cualquier evento que pueda contener el certificateId
        for (const eventName in transaction.events) {
          const event = transaction.events[eventName];
          if (event.returnValues && event.returnValues.certificateId) {
            certificateId = event.returnValues.certificateId;
            console.log("🎯 CertificateId encontrado en evento:", certificateId);
            break;
          }
        }
      }

      // Método 2: Si no se encuentra en eventos, usar el transaction hash como referencia
      if (certificateId === "No se pudo obtener el ID") {
        certificateId = `Referencia: ${transaction.transactionHash}`;
        console.log("ℹ️ Usando transaction hash como referencia");
      }

      // Método 3: Verificar el certificado en el contrato
      try {
        // Intentar obtener el certificado usando una combinación de los datos
        const expectedCertificateId = web3.utils.keccak256(
          web3.utils.encodePacked(
            formData.studentName,
            formData.courseName,
            formData.courseHash,
            transaction.blockNumber.toString(),
            account
          )
        );
        
        // Verificar si este certificado existe
        const certificateExists = await contract.methods.verifyCertificate(expectedCertificateId).call();
        if (certificateExists) {
          certificateId = expectedCertificateId;
          console.log("✅ CertificateId verificado en contrato:", certificateId);
        }
      } catch (verifyError) {
        console.log("⚠️ No se pudo verificar el certificateId automáticamente");
      }

      setTransactionStatus({
        success: true,
        transactionHash: transaction.transactionHash,
        certificateId: certificateId,
        message: "🎉 Certificado creado exitosamente en Sonic Testnet!",
        blockNumber: convertBigIntToNumber(transaction.blockNumber),
        gasUsed: convertBigIntToNumber(transaction.gasUsed),
        explorerUrl: `https://testnet.soniclabs.com/tx/${transaction.transactionHash}`
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
      } else if (error.message.includes("Certificate already exists")) {
        errorMessage = "Este certificado ya existe";
      }

      setTransactionStatus({
        success: false,
        error: error.message,
        message: errorMessage
      });
    }

    setLoading(false);
  };

  // ... (el resto del componente JSX permanece igual, pero actualiza la parte que muestra el resultado)

  return (
    <div className="container">
      {/* ... (header y wallet section igual) */}
      
      <main>
        {/* ... (condicionales de conexión igual) */}
        
        {isCorrectNetwork && (
          <div className="form-container">
            <form onSubmit={createCertificate} className="certificate-form">
              {/* ... (formulario igual) */}
            </form>

            {transactionStatus && (
              <div className={`transaction-result ${transactionStatus.success ? 'success' : 'error'}`}>
                <div className="result-header">
                  <h3>
                    {transactionStatus.success ? '✅ Certificado Creado' : '❌ Error'}
                  </h3>
                  <p>{transactionStatus.message}</p>
                </div>
                
                {transactionStatus.success && (
                  <div className="transaction-details">
                    <div className="detail-row">
                      <strong>🆔 ID del Certificado:</strong>
                      <code className="certificate-id">{transactionStatus.certificateId}</code>
                    </div>
                    <div className="detail-row">
                      <strong>📫 Hash de Transacción:</strong>
                      <code>
                        <a 
                          href={transactionStatus.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{color: 'inherit', textDecoration: 'underline'}}
                        >
                          {transactionStatus.transactionHash}
                        </a>
                      </code>
                    </div>
                    <div className="detail-row">
                      <strong>🔢 Block Number:</strong>
                      <span>{transactionStatus.blockNumber}</span>
                    </div>
                    <div className="detail-row">
                      <strong>⛽ Gas Utilizado:</strong>
                      <span>{transactionStatus.gasUsed}</span>
                    </div>
                    <div className="success-tips">
                      <p><strong>💡 Guarda esta información:</strong></p>
                      <ul>
                        <li>El <strong>ID del Certificado</strong> es único e inmutable</li>
                        <li>Puedes verificar el certificado usando el ID</li>
                        <li>La transacción está confirmada en la blockchain</li>
                      </ul>
                    </div>
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

        {/* ... (system info igual) */}
      </main>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          min-height: 100vh;
        }
        
        /* ... (tus estilos existentes) */
        
        .certificate-id {
          background: rgba(0,0,0,0.1);
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 12px;
          word-break: break-all;
          font-family: 'Courier New', monospace;
          display: block;
          margin-top: 5px;
          border: 1px solid rgba(0,0,0,0.2);
        }
        
        .success-tips {
          margin-top: 15px;
          padding: 15px;
          background: rgba(255,255,255,0.3);
          border-radius: 8px;
          border-left: 4px solid #28a745;
        }
        
        .success-tips ul {
          margin: 10px 0;
          padding-left: 20px;
        }
        
        .success-tips li {
          margin: 5px 0;
        }
        
        /* ... (el resto de tus estilos) */
      `}</style>
    </div>
  );
}
