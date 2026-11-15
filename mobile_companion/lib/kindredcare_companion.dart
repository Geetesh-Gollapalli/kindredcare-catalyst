// KindredCare AI — Flutter Mobile & Wearable Companion Architecture
// Built following @[plugin:flutter] (flutter-apply-architecture-best-practices):
// Strict separation of concerns across Data Layer (Service + Repository),
// ViewModel Layer (ChangeNotifier), and UI Layer (StatelessWidget + ListenableBuilder).

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// ============================================================================
// 1. DOMAIN MODELS (Immutable)
// ============================================================================
class ElderMedicationDose {
  const ElderMedicationDose({
    required this.id,
    required this.name,
    required this.dosage,
    required this.purpose,
    required this.scheduledTime,
    required this.mealTiming,
    required this.taken,
  });

  final String id;
  final String name;
  final String dosage;
  final String purpose;
  final String scheduledTime;
  final String mealTiming;
  final bool taken;
}

class CareCircleSnapshot {
  const CareCircleSnapshot({
    required this.circleId,
    required this.elderName,
    required this.bloodGroup,
    required this.doses,
  });

  final String circleId;
  final String elderName;
  final String bloodGroup;
  final List<ElderMedicationDose> doses;
}

// ============================================================================
// 2. DATA LAYER: STATELESS SERVICE & SINGLE-SOURCE-OF-TRUTH REPOSITORY
// ============================================================================
class KindredCareApiService {
  KindredCareApiService({required this.baseUrl, http.Client? client})
      : _client = client ?? http.Client();

  final String baseUrl;
  final http.Client _client;

  Future<Map<String, dynamic>> fetchCircleJson() async {
    final uri = Uri.parse('$baseUrl/api/circle');
    final response = await _client.get(uri);
    if (response.statusCode != 200) {
      throw Exception('Failed to load Care Circle (${response.statusCode})');
    }
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<void> confirmDoseTaken({
    required String medicationId,
    required String elderName,
  }) async {
    final uri = Uri.parse('$baseUrl/api/medications');
    final response = await _client.patch(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'action': 'log_dose',
        'medicationId': medicationId,
        'status': 'taken',
        'confirmedByRole': 'elder',
        'confirmedByName': elderName,
      }),
    );
    if (response.statusCode >= 400) {
      throw Exception('Failed to confirm medication dose');
    }
  }
}

class CareCircleRepository {
  CareCircleRepository({required KindredCareApiService apiService})
      : _apiService = apiService;

  final KindredCareApiService _apiService;
  CareCircleSnapshot? _cachedSnapshot;

  Future<CareCircleSnapshot> getCareCircle({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedSnapshot != null) {
      return _cachedSnapshot!;
    }
    final payload = await _apiService.fetchCircleJson();
    final circle = payload['circle'] as Map<String, dynamic>? ?? {};
    final medsRaw = circle['medications'] as List<dynamic>? ?? const [];

    final doses = medsRaw.map((raw) {
      final item = raw as Map<String, dynamic>;
      return ElderMedicationDose(
        id: item['id'] as String? ?? '',
        name: item['name'] as String? ?? 'Medicine',
        dosage: item['dosage'] as String? ?? '',
        purpose: item['purpose'] as String? ?? '',
        scheduledTime: item['scheduledTime'] as String? ?? '08:00',
        mealTiming: item['mealTiming'] as String? ?? 'after_meal',
        taken: false,
      );
    }).toList(growable: false);

    _cachedSnapshot = CareCircleSnapshot(
      circleId: circle['circleId'] as String? ?? 'KC-2026',
      elderName: circle['elderName'] as String? ?? 'Elder Companion',
      bloodGroup: circle['bloodGroup'] as String? ?? 'O+',
      doses: doses,
    );
    return _cachedSnapshot!;
  }

  Future<CareCircleSnapshot> markDoseTaken(
    String medicationId,
    String elderName,
  ) async {
    await _apiService.confirmDoseTaken(
      medicationId: medicationId,
      elderName: elderName,
    );
    return getCareCircle(forceRefresh: true);
  }
}

// ============================================================================
// 3. VIEWMODEL LAYER (MVVM with ChangeNotifier)
// ============================================================================
class ElderCompanionViewModel extends ChangeNotifier {
  ElderCompanionViewModel({required CareCircleRepository repository})
      : _repository = repository;

  final CareCircleRepository _repository;

  CareCircleSnapshot? _snapshot;
  CareCircleSnapshot? get snapshot => _snapshot;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  Future<void> loadCompanion() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _snapshot = await _repository.getCareCircle(forceRefresh: true);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> confirmDose(String medicationId) async {
    final current = _snapshot;
    if (current == null) return;
    _isLoading = true;
    notifyListeners();
    try {
      _snapshot = await _repository.markDoseTaken(
        medicationId,
        current.elderName,
      );
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// ============================================================================
// 4. UI PRESENTATION LAYER (Lean View + ListenableBuilder)
// ============================================================================
class ElderCompanionMobileView extends StatelessWidget {
  const ElderCompanionMobileView({super.key, required this.viewModel});

  final ElderCompanionViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) {
        if (viewModel.isLoading && viewModel.snapshot == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (viewModel.errorMessage != null && viewModel.snapshot == null) {
          return Scaffold(
            body: Center(
              child: Text(
                'Unable to load companion: ${viewModel.errorMessage}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          );
        }

        final circle = viewModel.snapshot;
        if (circle == null) {
          return const Scaffold(
            body: Center(child: Text('No Care Circle configured')),
          );
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF6F5F1),
          appBar: AppBar(
            backgroundColor: const Color(0xFF0F524B),
            foregroundColor: Colors.white,
            title: Text('${circle.elderName} • Daily Medicines'),
          ),
          body: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: circle.doses.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final dose = circle.doses[index];
              return Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${dose.scheduledTime} • ${dose.name} (${dose.dosage})',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Why I take this: ${dose.purpose}',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0E6B50),
                            foregroundColor: Colors.white,
                          ),
                          onPressed: () => viewModel.confirmDose(dose.id),
                          child: const Text(
                            '✓ I Took This Medicine',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
