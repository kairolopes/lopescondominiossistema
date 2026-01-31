
import { botFlow } from '../bot/flow';
import { sessionManager } from '../services/sessionManager';
import { zapiService } from '../services/zapi';
import { superlogicaService } from '../services/superlogica';
import { aiService } from '../services/ai';

// Mock dependencies
jest.mock('../services/zapi');
jest.mock('../services/superlogica');
jest.mock('../services/ai');

describe('Bot Flow Logic', () => {
  const mockPhone = '5511999999999';
  const mockSender = 'João';

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager._reset();
  });

  test('Should start conversation with welcome message', async () => {
    // Act
    await botFlow.handleMessage(mockPhone, 'Olá', mockSender);

    // Assert
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      expect.stringContaining('bem-vindo à Lopes Condomínios')
    );
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      expect.stringContaining('digite seu CPF')
    );
  });

  test('Should validate CPF and show Main Menu', async () => {
    // Arrange: Simulate previous state by sending initial message first (or assuming state logic works)
    // Since session is in-memory and private, we must flow through it sequentially
    await botFlow.handleMessage(mockPhone, 'Olá', mockSender); // Sets state to WAITING_CPF

    // Act: Send valid CPF
    await botFlow.handleMessage(mockPhone, '12345678901', mockSender);

    // Assert
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      expect.stringContaining('Localizei sua unidade')
    );
    // Should verify Main Menu was sent (sendOptionList)
    expect(zapiService.sendOptionList).toHaveBeenCalled();
  });

  test('Should handle invalid CPF', async () => {
    await botFlow.handleMessage(mockPhone, 'Olá', mockSender); // Reset/Start
    
    // Act: Send invalid CPF
    await botFlow.handleMessage(mockPhone, '123', mockSender);

    // Assert
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      expect.stringContaining('CPF inválido')
    );
  });

  test('Should handle Option 1 (Boletos)', async () => {
    // Setup state: Start -> Valid CPF -> Main Menu
    await botFlow.handleMessage(mockPhone, 'Olá', mockSender);
    await botFlow.handleMessage(mockPhone, '12345678901', mockSender);
    
    // Mock Superlogica response
    (superlogicaService.getPendingSlips as jest.Mock).mockResolvedValue([
      { vencimento: '10/10/2025', valor: '500,00', link: 'http://boleto.pdf' }
    ]);

    // Act: Select Option 1
    await botFlow.handleMessage(mockPhone, '1', mockSender);

    // Assert
    expect(superlogicaService.getPendingSlips).toHaveBeenCalled();
    expect(zapiService.sendPDF).toHaveBeenCalledWith(
      mockPhone,
      'http://boleto.pdf',
      expect.any(String)
    );
  });

  test('Should handle Option 2 (Reservas) flow', async () => {
    // Setup state
    await botFlow.handleMessage(mockPhone, 'Olá', mockSender);
    await botFlow.handleMessage(mockPhone, '12345678901', mockSender);

    // Mock Areas
    (superlogicaService.getCommonAreas as jest.Mock).mockResolvedValue([
      { id: '1', nome: 'Salão de Festas', capacidade: 50 }
    ]);

    // Act: Select Option 2
    await botFlow.handleMessage(mockPhone, '2', mockSender);

    // Assert: Check if areas are listed
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      expect.stringContaining('Salão de Festas')
    );

    // Act: Select Area 1
    await botFlow.handleMessage(mockPhone, '1', mockSender);
    
    // Assert: Ask for date
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      expect.stringContaining('Para qual data')
    );

    // Act: Provide date
    (superlogicaService.createReservation as jest.Mock).mockResolvedValue(true);
    await botFlow.handleMessage(mockPhone, '01/01/2026', mockSender);

    // Assert: Reservation confirmation
    expect(superlogicaService.createReservation).toHaveBeenCalled();
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      expect.stringContaining('Reserva confirmada')
    );
  });

  test('Should fallback to AI for unknown messages', async () => {
    // Setup state
    await botFlow.handleMessage(mockPhone, 'Olá', mockSender);
    await botFlow.handleMessage(mockPhone, '12345678901', mockSender);

    // Mock AI response
    (aiService.processQuery as jest.Mock).mockResolvedValue('Sou uma IA e posso ajudar.');

    // Act: Send random text
    await botFlow.handleMessage(mockPhone, 'Qual a cor do céu?', mockSender);

    // Assert
    expect(aiService.processQuery).toHaveBeenCalled();
    expect(zapiService.sendText).toHaveBeenCalledWith(
      mockPhone,
      'Sou uma IA e posso ajudar.'
    );
  });
});
