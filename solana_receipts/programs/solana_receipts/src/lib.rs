use anchor_lang::prelude::*;

declare_id!("xoDRdJoAhZ4Vzqzh9vRFr5U5yMH2H4emUVqwfvLSKMb");

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct FileMeta {
    pub name: String, // max 64
    pub hash: String, // max 64
}

#[program]
pub mod solana_receipts {
    use super::*;

    pub fn create_receipt(
      ctx: Context<CreateReceipt>,
      payer: Pubkey,
      tx_hash: String,
      title: String,
      description: String,
      files: Vec<FileMeta>,
  ) -> Result<()> {
      let receipt = &mut ctx.accounts.receipt;
      receipt.creator = ctx.accounts.user.key();
      receipt.payer = payer;
      receipt.tx_hash = tx_hash;
      receipt.title = title;
      receipt.description = description;
      receipt.files = files;
      receipt.timestamp = Clock::get()?.unix_timestamp;
      Ok(())
  }
}

#[derive(Accounts)]
pub struct CreateReceipt<'info> {
    #[account(
        init,
        payer = user,
        space = Receipt::LEN,
    )]
    pub receipt: Account<'info, Receipt>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Receipt {
    pub creator: Pubkey,          // 32
    pub payer: Pubkey,            // 32
    pub tx_hash: String,          // max 128 bytes
    pub title: String,            // max 64 bytes
    pub description: String,      // max 256 bytes
    pub files: Vec<FileMeta>,     // 5 files max (64+64 each + 4 prefix)
    pub timestamp: i64,           // 8
}

impl Receipt {
  pub const LEN: usize = 8 + 32 + 32 + (4 + 128) + (4 + 64) + (4 + 256) +
      4 + (5 * ((4 + 64) + (4 + 64))) + 8;
}
