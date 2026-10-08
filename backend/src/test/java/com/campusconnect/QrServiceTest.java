package com.campusconnect;

import com.campusconnect.service.QrService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QrServiceTest {

    @Test
    void generatesPngBytes() {
        byte[] png = new QrService().png("11111111-2222-3333-4444-555555555555", 256);
        assertTrue(png.length > 100);
        // every PNG starts with these signature bytes
        assertEquals((byte) 0x89, png[0]);
        assertEquals((byte) 'P', png[1]);
        assertEquals((byte) 'N', png[2]);
        assertEquals((byte) 'G', png[3]);
    }
}
