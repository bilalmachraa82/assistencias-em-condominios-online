export function generateValidationEmail(assistance: any, actionUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme a Conclusão do Serviço - Luv.img</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f5f5;">
        
        <!-- Container Principal -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    
                    <!-- Email Container -->
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #4a9b9e 0%, #3a7b7e 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <!-- Logo -->
                                            <img src="https://assistencias-em-condominios-online.lovable.app/lovable-uploads/42db5c3a-d970-4146-a940-7967cb8ae563.png" alt="Luv.img" style="height: 50px; margin-bottom: 10px;">
                                            <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 300;">Confirme a Conclusão do Serviço</h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Conteúdo Principal -->
                        <tr>
                            <td style="padding: 40px;">
                                
                                <!-- Saudação -->
                                <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                                    Olá <strong>${assistance.suppliers.name}</strong>,
                                </p>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Após realizar o serviço agendado para o edifício <strong>${assistance.buildings.name}</strong>, precisamos que confirme a sua conclusão.
                                </p>
                                
                                <!-- Detalhes da Solicitação -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafb; border-radius: 6px; padding: 25px; margin-bottom: 30px;">
                                    <tr>
                                        <td>
                                            <h2 style="color: #3a7b7e; font-size: 18px; margin: 0 0 20px 0; font-weight: 500;">Detalhes da Assistência</h2>
                                            
                                            <table width="100%" border="0" cellspacing="0" cellpadding="8">
                                                <tr>
                                                    <td width="35%" style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Tipo:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.type}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Categoria:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.intervention_types.name}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Localização:</strong></td>
                                                    <td style="color: #333333; font-size: 14px;">${assistance.buildings.address}</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #666666; font-size: 14px; vertical-align: top;"><strong>Descrição:</strong></td>
                                                    <td style="color: #333333; font-size: 14px; line-height: 1.5;">${assistance.description}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Para finalizar esta assistência, aceda ao seu portal personalizado:
                                </p>
                                
                                <!-- Botão CTA -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding: 0 0 30px 0;">
                                            <a href="${actionUrl}" style="display: inline-block; padding: 14px 40px; background-color: #4a9b9e; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                                                ACEDER AO PORTAL DO FORNECEDOR
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Funcionalidades do Portal -->
                                <div style="background-color: #f8fafb; border-left: 4px solid #059669; padding: 20px; margin-bottom: 30px; border-radius: 0 6px 6px 0;">
                                    <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
                                        <strong>✅ Para finalizar:</strong>
                                    </p>
                                    <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                        <li>Confirme a conclusão do trabalho</li>
                                        <li>Envie fotos do resultado final</li>
                                        <li>Adicione notas finais se necessário</li>
                                        <li>Mantenha comunicação ativa até ao fecho</li>
                                    </ul>
                                </div>
                                
                                <!-- Informação de Contacto -->
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 5px 0;">
                                    <strong>Precisa de ajuda?</strong> Entre em contacto:
                                </p>
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                    Email: <a href="mailto:info@luvimg.com" style="color: #4a9b9e; text-decoration: none;">info@luvimg.com</a><br>
                                    Telefone: <a href="tel:+351964233777" style="color: #4a9b9e; text-decoration: none;">+351 964 233 777</a>
                                </p>
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafb; padding: 30px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e5e5;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">
                                                Esta é uma mensagem automática, por favor não responda diretamente a este email.
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0 0 15px 0;">
                                                © ${new Date().getFullYear()} Luv.img - Administração de Condomínios | NIF: 516800960
                                            </p>
                                            <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0;">
                                                Rua António Luís Gomes 25A, 2790-356 Cascais
                                            </p>
                                            
                                            <!-- Links Sociais -->
                                            <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                                                <tr>
                                                    <td style="padding: 0 10px;">
                                                        <a href="https://www.facebook.com/LuvImg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Facebook</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.instagram.com/luv.img" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">Instagram</a>
                                                    </td>
                                                    <td style="padding: 0 10px; border-left: 1px solid #cccccc;">
                                                        <a href="https://www.linkedin.com/company/luvimg" style="color: #4a9b9e; text-decoration: none; font-size: 12px;">LinkedIn</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                    </table>
                    <!-- Fim Email Container -->
                    
                </td>
            </tr>
        </table>
        
    </body>
    </html>
  `;
}