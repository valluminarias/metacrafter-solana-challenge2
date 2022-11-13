// Import Solana web3 functinalities
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmRawTransaction,
    sendAndConfirmTransaction
} = require("@solana/web3.js");

const FROM_SECRET_KEY = new Uint8Array(
    [
        236, 171, 218,  86,  14, 192, 229,  27,  42, 229, 108,
        170, 163,  71, 136, 248,  29,  72, 176,  48,  93, 142,
        161, 233,  39, 200,   3, 236,  47,   5,  37, 234, 170,
        144, 198, 196, 115,  18, 175, 172,  85, 135, 175, 239,
        123, 230, 138,  20, 222, 181,  98,  16, 204,  91,  23,
        30, 149, 231,  36,   7, 202, 128, 210, 103
    ]
);

const getWalletBalance = async ( publicKey ) => {
    try {
        // Connect to the Devnet
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

        const balance = await connection.getBalance(
            new PublicKey(publicKey)
        );

        return balance;
    } catch (err) {
        console.log(err);
    }
};

const transferSol = async() => {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Get Keypair from Secret Key
    var from = Keypair.fromSecretKey(FROM_SECRET_KEY);

    console.log(`Sender wallet: ${from.publicKey.toString()}`);

    // Aidrop 2 SOL to Sender wallet
    console.log(`----------------------------------------`)
    console.log('Airdopping some SOL to Sender wallet!')
    const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(from.publicKey),
        2 * LAMPORTS_PER_SOL,
    )

    console.log('Airdrop signature: ' + fromAirDropSignature)

    // Latest blockhash (unique identifer of the block) of the cluster
    let latestBlockHash = await connection.getLatestBlockhash()

    // Confirm transaction using the last valid block height (refers to its time)
    // to check for transaction expiration
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: fromAirDropSignature,
    })

    console.log('Airdrop completed for the Sender account')

    const senderBalance = await getWalletBalance(from.publicKey.toString());

    console.log(`Wallet balance of the sender wallet: ${parseInt(senderBalance) / LAMPORTS_PER_SOL} SOL`);
    console.log(`----------------------------------------`)

    // Get the 50% balance of the sender wallet
    const fiftyPercent = senderBalance * 0.5;

    // Generate another Keypair (account we'll be sending to)
    const to = Keypair.generate();

    const receiverBalanceBefore = await getWalletBalance(to.publicKey.toString());
    console.log(`Receiver wallet: ${to.publicKey.toString()}`);
    console.log(`Wallet balance of the receiver wallet: ${parseInt(receiverBalanceBefore) / LAMPORTS_PER_SOL} SOL`);

    console.log(`----------------------------------------`)

    console.log(`Transferring ${fiftyPercent/LAMPORTS_PER_SOL} SOL to receiver wallet...`);

    try{
        // Send money from "from" wallet and into "to" wallet
        var transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to.publicKey,
                lamports: fiftyPercent,
            })
        );

        // Sign transaction
        var signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [from]
        );
        console.log('Transaction Signature is ', signature);

        const receiverBalance = await getWalletBalance(to.publicKey.toString());
        console.log(`Wallet balance of the receiver wallet: ${parseInt(receiverBalance) / LAMPORTS_PER_SOL} SOL`);
    }catch(e) {
        console.log(e);
        console.log('An error has occured, please restart the transaction by re-running the script.');
    }
    console.log(`----------------------------------------`)
}

transferSol();
